# LINE Bill Reminder — Design Spec
**Date:** 2026-04-14  
**Stack:** Next.js 16, MongoDB Atlas, Vercel, LINE Messaging API, LIFF, shadcn/ui

---

## Section 1: Architecture & Folder Structure

### Approach
Single Next.js 16 App Router project. All layers — LINE webhook, cron endpoints, LIFF UI — live together in one Vercel deployment. Clean Architecture enforced purely by folder convention, no IoC framework.

### Layer Dependency Rule
```
Presentation → Application (Use Cases) → Domain (Entities + Interfaces) ← Infrastructure
```
- **Domain** has zero framework dependencies — pure TypeScript entities + repository/service interfaces
- **Infrastructure** implements domain interfaces (Mongoose, LINE SDK)
- **Application** orchestrates use cases, depends only on domain interfaces
- **Presentation** contains React components (shadcn) and Next.js route handlers

### Project Tree
```
src/
  domain/
    entities/           # BillTemplate, BillInstance, ExternalApp
    repositories/       # IBillTemplateRepository, IBillInstanceRepository, IExternalAppRepository
    services/           # ILineMessagingService
    value-objects/      # IExternalApp interface
  application/
    use-cases/          # one file per use case
    dtos/               # Zod schemas for validation
  infrastructure/
    db/                 # Mongoose models + repository implementations
    line/               # LineMessagingService implementation
    lib/
      mongodb.ts        # singleton connection + retry
      container.ts      # factory functions for dependency wiring
  presentation/
    components/         # shadcn + custom UI components
    liff/               # LIFF-specific page layouts

app/                    # Next.js App Router
  api/
    webhook/route.ts
    cron/
      generate/route.ts
      remind/route.ts
    bills/
      route.ts          # GET + POST
      [id]/route.ts     # PATCH + DELETE
    external-apps/
      route.ts          # GET + POST
      [id]/route.ts     # DELETE
  liff/
    layout.tsx          # LIFF SDK init + bottom nav guard
    bills/
      page.tsx          # bill template list
      new/page.tsx      # create form
      [id]/edit/page.tsx
    history/page.tsx    # monthly instance history

scripts/
  seed.ts               # standalone Mongoose seed script
```

### Dependency Injection
No IoC container. `src/infrastructure/lib/container.ts` exports factory functions:
```ts
export function makeMarkBillPaidUseCase() {
  const repo = new MongooseBillInstanceRepo();
  const line = new LineMessagingService();
  return new MarkBillPaidUseCase(repo, line);
}
```
Each route handler calls the relevant factory. Fully testable, no magic.

---

## Section 2: Data Models

### `externalApps` collection
รวม billing apps + payment apps ไว้ใน collection เดียว กรองด้วย `appType[]`.

```ts
{
  _id: ObjectId,
  name: string,             // "K PLUS", "AIS"
  slug: string,             // "kplus", "ais" (unique)
  logoUrl: string,
  deepLink: string | null,  // "kplus://"
  webUrl: string | null,    // fallback URL
  appType: string[],        // ['billing'] | ['payment'] | ['billing','payment']
  isSystem: boolean,
  ownerId: string | null,   // null = system seed; LINE userId = user custom
  createdAt: Date,
}
```

**Indexes:** `{ slug }` unique, `{ appType, isSystem }`, `{ ownerId }`

**System seed:**

| App | appType |
|-----|---------|
| K PLUS, SCB Easy, BBL Mobile, Krungthai NEXT | `['payment']` |
| AIS, True, DTAC, UChoose, กฟน. (MEA), กปภ. (PWA), NT | `['billing']` |
| TrueMoney, Shopee Pay, PromptPay | `['billing', 'payment']` |

### Domain Interface
`IExternalApp` in `src/domain/value-objects/ExternalApp.ts`:
```ts
interface IExternalApp {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  deepLink: string | null;
  webUrl: string | null;
  appType: string[];
  isSystem: boolean;
  ownerId: string | null;
}
```

### Query Patterns
```ts
// LIFF billing app picker
find({ appType: 'billing', $or: [{ isSystem: true }, { ownerId: userId }] })

// LIFF payment app picker
find({ appType: 'payment', $or: [{ isSystem: true }, { ownerId: userId }] })
```
MongoDB array field query — `appType: 'billing'` matches documents where array contains `'billing'`.

### `billTemplates` collection

```ts
{
  _id: ObjectId,
  userId: string,             // LINE userId "Uxxxxxxx"
  name: string,               // "Netflix", "ค่าไฟ"
  dueDay: number,             // 1–31
  paymentAppId: ObjectId,     // ref → paymentApps (required)
  billingAppId: ObjectId | null, // ref → billingApps (optional)
  reminderDays: number[],     // default [3, 1]; [] = no reminders
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:** `{ userId }`

### `billInstances` collection

```ts
{
  _id: ObjectId,
  templateId: ObjectId,       // ref → billTemplates
  userId: string,
  name: string,               // snapshotted from template
  dueDay: number,             // snapshotted + clamped to month
  month: number,              // 1–12
  year: number,
  isPaid: boolean,
  paidAt: Date | null,
  reminderDays: number[],     // snapshotted from template
  paymentAppSnapshot: {
    name: string,
    logoUrl: string,
    deepLink: string | null,
    webUrl: string | null,
  },
  billingAppSnapshot: {
    name: string,
    logoUrl: string,
    deepLink: string | null,
    webUrl: string | null,
  } | null,
  createdAt: Date,
}
```

**Indexes:**
- `{ userId, year, month, isPaid }` — daily reminder queries
- `{ templateId, year, month }` unique — idempotency for generation

### Snapshot Pattern
At generation time, `billInstances` copies `name`, `dueDay`, `reminderDays`, `paymentAppSnapshot`, and `billingAppSnapshot` from the template + referenced apps. Template/app edits after generation never corrupt existing instances or reminder messages.

---

## Section 3: API Routes & Use Cases

### Route Handlers

#### LINE Webhook
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhook` | LINE webhook — verify signature, handle postbacks |

#### Cron (require `Authorization: Bearer <CRON_SECRET>`)
| Method | Path | Schedule (UTC) | Bangkok time |
|--------|------|----------------|--------------|
| GET | `/api/cron/generate` | `0 1 1 * *` | 1st of month, 08:00 |
| GET | `/api/cron/remind` | `0 1 * * *` | Daily 08:00 |

#### Bills CRUD (LIFF, require valid LIFF token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bills?userId=` | List bill templates for user |
| POST | `/api/bills` | Create bill template |
| PATCH | `/api/bills/:id` | Update bill template |
| DELETE | `/api/bills/:id` | Delete bill template |

#### External Apps (LIFF)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/external-apps?userId=&appType=billing` | Billing apps (system + user custom) |
| GET | `/api/external-apps?userId=&appType=payment` | Payment apps (system + user custom) |
| POST | `/api/external-apps` | Create custom app (body includes `appType[]`) |
| DELETE | `/api/external-apps/:id` | Delete (only owner, not system) |

### Use Cases (`src/application/use-cases/`)

#### Core
- **`MarkBillPaidUseCase`** — find instance → guard already-paid → set `isPaid=true`, `paidAt=now` → reply LINE "✅ บันทึกการจ่าย {name} แล้ว"
- **`GenerateMonthlyBillsUseCase`** — fetch all templates → for each: clamp dueDay → resolve app snapshots → upsert instance (skip on unique-index conflict) → return `{ created, skipped }`
- **`SendBillRemindersUseCase`** — compute today (Bangkok) → query unpaid instances matching reminder window (same-month + cross-month) → group by userId → send Flex carousel per user sequentially → log failures, continue

#### LIFF Bill CRUD
- `CreateBillTemplateUseCase`
- `UpdateBillTemplateUseCase`
- `DeleteBillTemplateUseCase`
- `GetBillTemplatesUseCase`
- `GetBillInstancesUseCase` — accepts `{ userId, month, year }` params; defaults to current Bangkok month. Used by history screen's month switcher.

#### External Apps CRUD (single set, filtered by `appType`)
- `GetExternalAppsUseCase` — accepts `{ userId, appType? }`, returns system + user's own
- `CreateExternalAppUseCase` — validates `appType[]` contains at least one valid value
- `DeleteExternalAppUseCase` — guards `isSystem === false` and `ownerId === userId`

### LIFF Authentication
LINE identity token from LIFF SDK verified server-side via `liff.verifyToken()` call in a shared middleware helper. No session cookies. `userId` extracted from verified token and matched against resource ownership.

---

## Section 4: LIFF UI

### Pages

| Route | Description |
|-------|-------------|
| `app/liff/layout.tsx` | LIFF SDK init, bottom nav (บิล / ประวัติ), non-LIFF access guard |
| `app/liff/bills/page.tsx` | Bill template list — card per template, edit/delete |
| `app/liff/bills/new/page.tsx` | Create bill form |
| `app/liff/bills/[id]/edit/page.tsx` | Edit bill form |
| `app/liff/history/page.tsx` | Monthly instance history with month switcher |

### Bill Form Fields
- **ชื่อบิล** — text input
- **วันครบกำหนด** — number input (1–31)
- **แอพดูยอด** — chip picker from `billingApps` (optional)
- **แอพจ่ายเงิน** — chip picker from `paymentApps` (required)
- **แจ้งเตือนล่วงหน้า** — multi-chip input for `reminderDays` (default: 3, 1)

### History Screen
- Month switcher (สไลด์ย้อนหลัง)
- Each bill instance shows: name, due date, paid/unpaid badge
- Unpaid bills show "ยังไม่จ่าย" badge (red/amber by urgency)

### Component Library
- shadcn/ui: Button, Card, Input, Select, Badge, Sheet (mobile drawer for forms)
- All Thai language UI copy

---

## Section 5: Flex Message Design

### Bubble Structure (per bill)
```
┌─────────────────────────────────┐
│  💳 แจ้งเตือนบิล               │  ← gradient header (purple→blue)
│  ค่า Netflix                    │
│  ครบกำหนด: 5 เม.ย. 2026         │
├─────────────────────────────────┤
│  ⏰ อีก 3 วัน                   │  ← yellow urgency badge
├────────────┬──────────┬─────────┤
│  📱 ดูยอด  │ 💳 จ่าย  │ ✅ จ่าย │  ← up to 3 buttons
│ (billing)  │(payment) │แล้ว     │
└────────────┴──────────┴─────────┘
```

- **ดูยอด button** — hidden if `billingAppSnapshot` is null. Uses `deepLink` first, falls back to `webUrl`.
- **จ่าย button** — hidden if both `deepLink` and `webUrl` are null on `paymentAppSnapshot`.
- **จ่ายแล้ว button** — always shown. Postback data: `MARK_PAID:{instanceId}`.
- One Flex carousel per user; one bubble per bill due today per reminder window.

---

## Section 6: Error Handling & Edge Cases

### Webhook
- Invalid LINE signature → 400
- `instanceId` not found → reply "ไม่พบบิลนี้", return 200
- Already paid → reply "จ่ายไปแล้วเมื่อ {date}", return 200
- Other event types → silent 200

### Cron — Generate
- Missing/invalid `CRON_SECRET` → 401
- `dueDay > days-in-month` → clamp to last day of month
- Instance already exists → skip (unique index), increment skipped count
- Returns `{ created: N, skipped: N }`

### Cron — Remind
- Missing/invalid `CRON_SECRET` → 401
- **Same-month:** `dueDay - reminderDay === todayDay`
- **Cross-month:** `dueDay - reminderDay < 1` → fires on `daysInPrevMonth + dueDay - reminderDay` of previous month. Use case queries both current and previous month unpaid instances.
- LINE send failure per user → log error, continue to next user
- No bills matching today → silent 200

### LIFF APIs
- Invalid LIFF token → 401
- Resource not found → 404
- Delete app owned by another user → 403
- Validation errors (Zod) → 422 with field-level errors

### MongoDB & Timezone
- Connection: `src/infrastructure/lib/mongodb.ts` singleton with retry options
- All "today" calculations via `date-fns-tz` with `Asia/Bangkok` (UTC+7)
- Cron fires at UTC 01:00 = Bangkok 08:00 to avoid midnight edge cases

---

## Section 7: Seed Script & Configuration

### `scripts/seed.ts`
Standalone Mongoose connection (no Next.js bootstrap). Clears and re-seeds:
1. `externalApps` — 14 system apps (4 payment-only, 7 billing-only, 3 both)
2. `billTemplates` — 5 sample templates across 2 LINE users

### `.env.example`
```env
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/reminder
CRON_SECRET=
LIFF_ID=
PORT=3000
NODE_ENV=development
```

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/generate", "schedule": "0 1 1 * *" },
    { "path": "/api/cron/remind",   "schedule": "0 1 * * *" }
  ]
}
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@line/bot-sdk` | LINE Messaging API + signature verification |
| `@line/liff` | LIFF SDK (client-side) |
| `mongoose` | MongoDB ODM |
| `zod` | DTO validation (replaces class-validator — native Next.js) |
| `date-fns-tz` | Bangkok timezone calculations |
| `shadcn/ui` | UI component library |

---

## Out of Scope (MVP)
- Admin portal
- Push notifications other than LINE
- Bill amount tracking (variable amounts)
- One-time (non-recurring) bills
- Multi-language support
