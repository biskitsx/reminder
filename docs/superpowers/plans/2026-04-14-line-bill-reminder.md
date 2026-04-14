# LINE Bill Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-user LINE Bot that reminds users to pay monthly bills, with a LIFF UI for managing bills, deployed as a single Next.js 16 project on Vercel.

**Architecture:** Clean Architecture via folder convention — `domain/` → `application/` → `infrastructure/` ← `presentation/`. No IoC container; a `container.ts` factory file wires dependencies per route. Next.js 16 App Router handles all HTTP — LINE webhook, cron endpoints, and LIFF pages in one Vercel project.

**Tech Stack:** Next.js 16, TypeScript, MongoDB Atlas + Mongoose, LINE Messaging API (`@line/bot-sdk`), LIFF (`@line/liff`), shadcn/ui, Zod, date-fns-tz, Vercel Cron

---

## File Map

```
src/
  domain/
    entities/
      BillTemplate.ts
      BillInstance.ts
      ExternalApp.ts
    repositories/
      IBillTemplateRepository.ts
      IBillInstanceRepository.ts
      IExternalAppRepository.ts
    services/
      ILineMessagingService.ts
  application/
    use-cases/
      MarkBillPaidUseCase.ts
      GenerateMonthlyBillsUseCase.ts
      SendBillRemindersUseCase.ts
      CreateBillTemplateUseCase.ts
      UpdateBillTemplateUseCase.ts
      DeleteBillTemplateUseCase.ts
      GetBillTemplatesUseCase.ts
      GetBillInstancesUseCase.ts
      GetExternalAppsUseCase.ts
      CreateExternalAppUseCase.ts
      DeleteExternalAppUseCase.ts
    dtos/
      BillTemplateDto.ts
      ExternalAppDto.ts
  infrastructure/
    db/
      models/
        ExternalAppModel.ts
        BillTemplateModel.ts
        BillInstanceModel.ts
      repositories/
        MongooseExternalAppRepository.ts
        MongooseBillTemplateRepository.ts
        MongooseBillInstanceRepository.ts
    line/
      LineMessagingService.ts
      FlexMessageBuilder.ts
    lib/
      mongodb.ts
      container.ts
      verifyLiffToken.ts
  presentation/
    components/
      AppPicker.tsx
      ReminderDaysPicker.tsx
      BillCard.tsx
      InstanceStatusBadge.tsx

app/
  api/
    webhook/route.ts
    cron/generate/route.ts
    cron/remind/route.ts
    bills/route.ts
    bills/[id]/route.ts
    external-apps/route.ts
    external-apps/[id]/route.ts
  liff/
    layout.tsx
    bills/page.tsx
    bills/new/page.tsx
    bills/[id]/edit/page.tsx
    history/page.tsx

scripts/
  seed.ts

vercel.json
.env.example
```

---

## Task 1: Project Scaffold & Configuration

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `.env.example`
- Create: `vercel.json`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Next.js 16 project**

```bash
cd /Users/user/reminder
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

- [ ] **Step 2: Install dependencies**

```bash
npm install mongoose @line/bot-sdk @line/liff date-fns date-fns-tz zod
npm install --save-dev @types/node tsx
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
# Choose: Default style, Slate base color, CSS variables: yes
npx shadcn@latest add button card input badge sheet label select
```

- [ ] **Step 4: Create `.env.example`**

```env
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/reminder
CRON_SECRET=
LIFF_ID=
NODE_ENV=development
```

- [ ] **Step 5: Create `.env.local`** (copy from example, fill in real values for local dev)

```bash
cp .env.example .env.local
```

- [ ] **Step 6: Create `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/generate", "schedule": "0 1 1 * *" },
    { "path": "/api/cron/remind",   "schedule": "0 1 * * *" }
  ]
}
```

- [ ] **Step 7: Create folder structure**

```bash
mkdir -p src/domain/entities \
         src/domain/repositories \
         src/domain/services \
         src/application/use-cases \
         src/application/dtos \
         src/infrastructure/db/models \
         src/infrastructure/db/repositories \
         src/infrastructure/line \
         src/infrastructure/lib \
         src/presentation/components \
         scripts
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 project with dependencies"
```

---

## Task 2: Domain Layer — Entities & Interfaces

**Files:**
- Create: `src/domain/entities/ExternalApp.ts`
- Create: `src/domain/entities/BillTemplate.ts`
- Create: `src/domain/entities/BillInstance.ts`
- Create: `src/domain/repositories/IExternalAppRepository.ts`
- Create: `src/domain/repositories/IBillTemplateRepository.ts`
- Create: `src/domain/repositories/IBillInstanceRepository.ts`
- Create: `src/domain/services/ILineMessagingService.ts`

- [ ] **Step 1: Create `src/domain/entities/ExternalApp.ts`**

```typescript
export interface IExternalApp {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  deepLink: string | null;
  webUrl: string | null;
  appType: string[]; // ['billing'] | ['payment'] | ['billing','payment']
  isSystem: boolean;
  ownerId: string | null;
  createdAt: Date;
}

export interface IExternalAppSnapshot {
  name: string;
  logoUrl: string;
  deepLink: string | null;
  webUrl: string | null;
}
```

- [ ] **Step 2: Create `src/domain/entities/BillTemplate.ts`**

```typescript
export interface IBillTemplate {
  id: string;
  userId: string;
  name: string;
  dueDay: number; // 1–31
  paymentAppId: string;
  billingAppId: string | null;
  reminderDays: number[]; // default [3, 1]
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 3: Create `src/domain/entities/BillInstance.ts`**

```typescript
import { IExternalAppSnapshot } from './ExternalApp';

export interface IBillInstance {
  id: string;
  templateId: string;
  userId: string;
  name: string;
  dueDay: number;
  month: number; // 1–12
  year: number;
  isPaid: boolean;
  paidAt: Date | null;
  reminderDays: number[];
  paymentAppSnapshot: IExternalAppSnapshot;
  billingAppSnapshot: IExternalAppSnapshot | null;
  createdAt: Date;
}
```

- [ ] **Step 4: Create `src/domain/repositories/IExternalAppRepository.ts`**

```typescript
import { IExternalApp } from '../entities/ExternalApp';

export interface IExternalAppRepository {
  findById(id: string): Promise<IExternalApp | null>;
  findByUserAndType(userId: string, appType?: string): Promise<IExternalApp[]>;
  create(data: Omit<IExternalApp, 'id' | 'createdAt'>): Promise<IExternalApp>;
  deleteById(id: string): Promise<void>;
}
```

- [ ] **Step 5: Create `src/domain/repositories/IBillTemplateRepository.ts`**

```typescript
import { IBillTemplate } from '../entities/BillTemplate';

export interface IBillTemplateRepository {
  findById(id: string): Promise<IBillTemplate | null>;
  findByUserId(userId: string): Promise<IBillTemplate[]>;
  findAll(): Promise<IBillTemplate[]>;
  create(data: Omit<IBillTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBillTemplate>;
  update(id: string, data: Partial<Omit<IBillTemplate, 'id' | 'createdAt'>>): Promise<IBillTemplate | null>;
  deleteById(id: string): Promise<void>;
}
```

- [ ] **Step 6: Create `src/domain/repositories/IBillInstanceRepository.ts`**

```typescript
import { IBillInstance } from '../entities/BillInstance';

export interface IBillInstanceRepository {
  findById(id: string): Promise<IBillInstance | null>;
  findByUserMonthYear(userId: string, month: number, year: number): Promise<IBillInstance[]>;
  findUnpaidForReminder(month: number, year: number): Promise<IBillInstance[]>;
  create(data: Omit<IBillInstance, 'id' | 'createdAt'>): Promise<IBillInstance>;
  markPaid(id: string, paidAt: Date): Promise<IBillInstance | null>;
  existsByTemplateMonthYear(templateId: string, month: number, year: number): Promise<boolean>;
}
```

- [ ] **Step 7: Create `src/domain/services/ILineMessagingService.ts`**

```typescript
export interface IFlexBubble {
  instanceId: string;
  billName: string;
  dueDate: string;     // formatted Thai date e.g. "5 เม.ย. 2026"
  daysLeft: number;
  paymentApp: { name: string; deepLink: string | null; webUrl: string | null } | null;
  billingApp: { name: string; deepLink: string | null; webUrl: string | null } | null;
}

export interface ILineMessagingService {
  sendFlexCarousel(userId: string, bubbles: IFlexBubble[]): Promise<void>;
  replyText(replyToken: string, text: string): Promise<void>;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/domain/
git commit -m "feat: add domain entities and repository interfaces"
```

---

## Task 3: Infrastructure — MongoDB Connection & Models

**Files:**
- Create: `src/infrastructure/lib/mongodb.ts`
- Create: `src/infrastructure/db/models/ExternalAppModel.ts`
- Create: `src/infrastructure/db/models/BillTemplateModel.ts`
- Create: `src/infrastructure/db/models/BillInstanceModel.ts`

- [ ] **Step 1: Create `src/infrastructure/lib/mongodb.ts`**

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
```

- [ ] **Step 2: Create `src/infrastructure/db/models/ExternalAppModel.ts`**

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IExternalApp } from '@/domain/entities/ExternalApp';

export type ExternalAppDocument = Omit<IExternalApp, 'id'> & Document;

const ExternalAppSchema = new Schema<ExternalAppDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
    deepLink: { type: String, default: null },
    webUrl: { type: String, default: null },
    appType: { type: [String], required: true },
    isSystem: { type: Boolean, required: true, default: false },
    ownerId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ExternalAppSchema.index({ appType: 1, isSystem: 1 });
ExternalAppSchema.index({ ownerId: 1 });

export const ExternalAppModel: Model<ExternalAppDocument> =
  mongoose.models.ExternalApp ??
  mongoose.model<ExternalAppDocument>('ExternalApp', ExternalAppSchema);
```

- [ ] **Step 3: Create `src/infrastructure/db/models/BillTemplateModel.ts`**

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

export type BillTemplateDocument = Omit<IBillTemplate, 'id' | 'paymentAppId' | 'billingAppId'> & {
  paymentAppId: Types.ObjectId;
  billingAppId: Types.ObjectId | null;
} & Document;

const BillTemplateSchema = new Schema<BillTemplateDocument>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    paymentAppId: { type: Schema.Types.ObjectId, ref: 'ExternalApp', required: true },
    billingAppId: { type: Schema.Types.ObjectId, ref: 'ExternalApp', default: null },
    reminderDays: { type: [Number], default: [3, 1] },
  },
  { timestamps: true }
);

BillTemplateSchema.index({ userId: 1 });

export const BillTemplateModel: Model<BillTemplateDocument> =
  mongoose.models.BillTemplate ??
  mongoose.model<BillTemplateDocument>('BillTemplate', BillTemplateSchema);
```

- [ ] **Step 4: Create `src/infrastructure/db/models/BillInstanceModel.ts`**

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IBillInstance } from '@/domain/entities/BillInstance';

const AppSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    deepLink: { type: String, default: null },
    webUrl: { type: String, default: null },
  },
  { _id: false }
);

export type BillInstanceDocument = Omit<IBillInstance, 'id' | 'templateId'> & {
  templateId: Types.ObjectId;
} & Document;

const BillInstanceSchema = new Schema<BillInstanceDocument>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'BillTemplate', required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    dueDay: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date, default: null },
    reminderDays: { type: [Number], required: true },
    paymentAppSnapshot: { type: AppSnapshotSchema, required: true },
    billingAppSnapshot: { type: AppSnapshotSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BillInstanceSchema.index({ userId: 1, year: 1, month: 1, isPaid: 1 });
BillInstanceSchema.index({ templateId: 1, year: 1, month: 1 }, { unique: true });

export const BillInstanceModel: Model<BillInstanceDocument> =
  mongoose.models.BillInstance ??
  mongoose.model<BillInstanceDocument>('BillInstance', BillInstanceSchema);
```

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/lib/mongodb.ts src/infrastructure/db/models/
git commit -m "feat: add MongoDB connection and Mongoose models"
```

---

## Task 4: Infrastructure — Mongoose Repositories

**Files:**
- Create: `src/infrastructure/db/repositories/MongooseExternalAppRepository.ts`
- Create: `src/infrastructure/db/repositories/MongooseBillTemplateRepository.ts`
- Create: `src/infrastructure/db/repositories/MongooseBillInstanceRepository.ts`

- [ ] **Step 1: Create `src/infrastructure/db/repositories/MongooseExternalAppRepository.ts`**

```typescript
import { connectDB } from '@/infrastructure/lib/mongodb';
import { ExternalAppModel } from '../models/ExternalAppModel';
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';

function toEntity(doc: any): IExternalApp {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl,
    deepLink: doc.deepLink,
    webUrl: doc.webUrl,
    appType: doc.appType,
    isSystem: doc.isSystem,
    ownerId: doc.ownerId,
    createdAt: doc.createdAt,
  };
}

export class MongooseExternalAppRepository implements IExternalAppRepository {
  async findById(id: string): Promise<IExternalApp | null> {
    await connectDB();
    const doc = await ExternalAppModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserAndType(userId: string, appType?: string): Promise<IExternalApp[]> {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [{ isSystem: true }, { ownerId: userId }],
    };
    if (appType) filter.appType = appType;
    const docs = await ExternalAppModel.find(filter).lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IExternalApp, 'id' | 'createdAt'>): Promise<IExternalApp> {
    await connectDB();
    const doc = await ExternalAppModel.create(data);
    return toEntity(doc.toObject());
  }

  async deleteById(id: string): Promise<void> {
    await connectDB();
    await ExternalAppModel.findByIdAndDelete(id);
  }
}
```

- [ ] **Step 2: Create `src/infrastructure/db/repositories/MongooseBillTemplateRepository.ts`**

```typescript
import { connectDB } from '@/infrastructure/lib/mongodb';
import { BillTemplateModel } from '../models/BillTemplateModel';
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

function toEntity(doc: any): IBillTemplate {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    dueDay: doc.dueDay,
    paymentAppId: doc.paymentAppId.toString(),
    billingAppId: doc.billingAppId ? doc.billingAppId.toString() : null,
    reminderDays: doc.reminderDays,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseBillTemplateRepository implements IBillTemplateRepository {
  async findById(id: string): Promise<IBillTemplate | null> {
    await connectDB();
    const doc = await BillTemplateModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<IBillTemplate[]> {
    await connectDB();
    const docs = await BillTemplateModel.find({ userId }).lean();
    return docs.map(toEntity);
  }

  async findAll(): Promise<IBillTemplate[]> {
    await connectDB();
    const docs = await BillTemplateModel.find().lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IBillTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBillTemplate> {
    await connectDB();
    const doc = await BillTemplateModel.create(data);
    return toEntity(doc.toObject());
  }

  async update(id: string, data: Partial<Omit<IBillTemplate, 'id' | 'createdAt'>>): Promise<IBillTemplate | null> {
    await connectDB();
    const doc = await BillTemplateModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return doc ? toEntity(doc) : null;
  }

  async deleteById(id: string): Promise<void> {
    await connectDB();
    await BillTemplateModel.findByIdAndDelete(id);
  }
}
```

- [ ] **Step 3: Create `src/infrastructure/db/repositories/MongooseBillInstanceRepository.ts`**

```typescript
import { connectDB } from '@/infrastructure/lib/mongodb';
import { BillInstanceModel } from '../models/BillInstanceModel';
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IBillInstance } from '@/domain/entities/BillInstance';

function toEntity(doc: any): IBillInstance {
  return {
    id: doc._id.toString(),
    templateId: doc.templateId.toString(),
    userId: doc.userId,
    name: doc.name,
    dueDay: doc.dueDay,
    month: doc.month,
    year: doc.year,
    isPaid: doc.isPaid,
    paidAt: doc.paidAt ?? null,
    reminderDays: doc.reminderDays,
    paymentAppSnapshot: doc.paymentAppSnapshot,
    billingAppSnapshot: doc.billingAppSnapshot ?? null,
    createdAt: doc.createdAt,
  };
}

export class MongooseBillInstanceRepository implements IBillInstanceRepository {
  async findById(id: string): Promise<IBillInstance | null> {
    await connectDB();
    const doc = await BillInstanceModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserMonthYear(userId: string, month: number, year: number): Promise<IBillInstance[]> {
    await connectDB();
    const docs = await BillInstanceModel.find({ userId, month, year }).lean();
    return docs.map(toEntity);
  }

  async findUnpaidForReminder(month: number, year: number): Promise<IBillInstance[]> {
    await connectDB();
    // Fetch current month + previous month unpaid instances for cross-month reminder support
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const docs = await BillInstanceModel.find({
      isPaid: false,
      $or: [
        { month, year },
        { month: prevMonth, year: prevYear },
      ],
    }).lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IBillInstance, 'id' | 'createdAt'>): Promise<IBillInstance> {
    await connectDB();
    const doc = await BillInstanceModel.create(data);
    return toEntity(doc.toObject());
  }

  async markPaid(id: string, paidAt: Date): Promise<IBillInstance | null> {
    await connectDB();
    const doc = await BillInstanceModel.findByIdAndUpdate(
      id,
      { isPaid: true, paidAt },
      { new: true }
    ).lean();
    return doc ? toEntity(doc) : null;
  }

  async existsByTemplateMonthYear(templateId: string, month: number, year: number): Promise<boolean> {
    await connectDB();
    const count = await BillInstanceModel.countDocuments({ templateId, month, year });
    return count > 0;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/db/repositories/
git commit -m "feat: add Mongoose repository implementations"
```

---

## Task 5: Infrastructure — LINE Messaging Service & Flex Builder

**Files:**
- Create: `src/infrastructure/line/FlexMessageBuilder.ts`
- Create: `src/infrastructure/line/LineMessagingService.ts`

- [ ] **Step 1: Create `src/infrastructure/line/FlexMessageBuilder.ts`**

```typescript
import { IFlexBubble } from '@/domain/services/ILineMessagingService';
import { FlexBubble, FlexCarousel } from '@line/bot-sdk';

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export function buildFlexCarousel(bubbles: IFlexBubble[]): FlexCarousel {
  return {
    type: 'carousel',
    contents: bubbles.map(buildBubble),
  };
}

function buildBubble(data: IFlexBubble): FlexBubble {
  const actions = [];

  if (data.billingApp) {
    const uri = data.billingApp.deepLink ?? data.billingApp.webUrl ?? '';
    actions.push({
      type: 'uri' as const,
      label: `📱 ดูยอด`,
      uri,
    });
  }

  if (data.paymentApp && (data.paymentApp.deepLink || data.paymentApp.webUrl)) {
    const uri = data.paymentApp.deepLink ?? data.paymentApp.webUrl ?? '';
    actions.push({
      type: 'uri' as const,
      label: `💳 ${data.paymentApp.name}`,
      uri,
    });
  }

  actions.push({
    type: 'postback' as const,
    label: '✅ จ่ายแล้ว',
    data: `MARK_PAID:${data.instanceId}`,
    displayText: 'จ่ายแล้ว',
  });

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '💳 แจ้งเตือนบิล', size: 'xs', color: '#ffffffcc' },
        { type: 'text', text: data.billName, size: 'xl', weight: 'bold', color: '#ffffff' },
        { type: 'text', text: `ครบกำหนด: ${data.dueDate}`, size: 'sm', color: '#ffffffcc' },
      ],
      backgroundColor: '#7c3aed',
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `⏰ อีก ${data.daysLeft} วัน`,
              size: 'sm',
              weight: 'bold',
              color: '#d97706',
              backgroundColor: '#fef3c7',
              paddingAll: '4px',
              cornerRadius: '99px',
            },
          ],
          paddingBottom: '12px',
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: actions.map((action) => ({
            type: 'button',
            action,
            style: action.type === 'postback' ? 'primary' : 'secondary',
            color: action.type === 'postback' ? '#10b981' : undefined,
            flex: 1,
          })),
        },
      ],
      paddingAll: '16px',
    },
  };
}

export function formatThaiDate(day: number, month: number, year: number): string {
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}
```

- [ ] **Step 2: Create `src/infrastructure/line/LineMessagingService.ts`**

```typescript
import { messagingApi } from '@line/bot-sdk';
import { ILineMessagingService, IFlexBubble } from '@/domain/services/ILineMessagingService';
import { buildFlexCarousel } from './FlexMessageBuilder';

export class LineMessagingService implements ILineMessagingService {
  private client: messagingApi.MessagingApiClient;

  constructor() {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    });
  }

  async sendFlexCarousel(userId: string, bubbles: IFlexBubble[]): Promise<void> {
    const carousel = buildFlexCarousel(bubbles);
    await this.client.pushMessage({
      to: userId,
      messages: [{ type: 'flex', altText: `แจ้งเตือนบิล ${bubbles.length} รายการ`, contents: carousel }],
    });
  }

  async replyText(replyToken: string, text: string): Promise<void> {
    await this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/line/
git commit -m "feat: add LINE messaging service and Flex Message builder"
```

---

## Task 6: Infrastructure — Container & LIFF Token Verification

**Files:**
- Create: `src/infrastructure/lib/container.ts`
- Create: `src/infrastructure/lib/verifyLiffToken.ts`

- [ ] **Step 1: Create `src/infrastructure/lib/container.ts`**

```typescript
import { MongooseBillInstanceRepository } from '../db/repositories/MongooseBillInstanceRepository';
import { MongooseBillTemplateRepository } from '../db/repositories/MongooseBillTemplateRepository';
import { MongooseExternalAppRepository } from '../db/repositories/MongooseExternalAppRepository';
import { LineMessagingService } from '../line/LineMessagingService';
import { MarkBillPaidUseCase } from '@/application/use-cases/MarkBillPaidUseCase';
import { GenerateMonthlyBillsUseCase } from '@/application/use-cases/GenerateMonthlyBillsUseCase';
import { SendBillRemindersUseCase } from '@/application/use-cases/SendBillRemindersUseCase';
import { GetBillTemplatesUseCase } from '@/application/use-cases/GetBillTemplatesUseCase';
import { CreateBillTemplateUseCase } from '@/application/use-cases/CreateBillTemplateUseCase';
import { UpdateBillTemplateUseCase } from '@/application/use-cases/UpdateBillTemplateUseCase';
import { DeleteBillTemplateUseCase } from '@/application/use-cases/DeleteBillTemplateUseCase';
import { GetBillInstancesUseCase } from '@/application/use-cases/GetBillInstancesUseCase';
import { GetExternalAppsUseCase } from '@/application/use-cases/GetExternalAppsUseCase';
import { CreateExternalAppUseCase } from '@/application/use-cases/CreateExternalAppUseCase';
import { DeleteExternalAppUseCase } from '@/application/use-cases/DeleteExternalAppUseCase';

export function makeMarkBillPaidUseCase() {
  return new MarkBillPaidUseCase(
    new MongooseBillInstanceRepository(),
    new LineMessagingService()
  );
}

export function makeGenerateMonthlyBillsUseCase() {
  return new GenerateMonthlyBillsUseCase(
    new MongooseBillTemplateRepository(),
    new MongooseBillInstanceRepository(),
    new MongooseExternalAppRepository()
  );
}

export function makeSendBillRemindersUseCase() {
  return new SendBillRemindersUseCase(
    new MongooseBillInstanceRepository(),
    new LineMessagingService()
  );
}

export function makeGetBillTemplatesUseCase() {
  return new GetBillTemplatesUseCase(new MongooseBillTemplateRepository());
}

export function makeCreateBillTemplateUseCase() {
  return new CreateBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeUpdateBillTemplateUseCase() {
  return new UpdateBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeDeleteBillTemplateUseCase() {
  return new DeleteBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeGetBillInstancesUseCase() {
  return new GetBillInstancesUseCase(new MongooseBillInstanceRepository());
}

export function makeGetExternalAppsUseCase() {
  return new GetExternalAppsUseCase(new MongooseExternalAppRepository());
}

export function makeCreateExternalAppUseCase() {
  return new CreateExternalAppUseCase(new MongooseExternalAppRepository());
}

export function makeDeleteExternalAppUseCase() {
  return new DeleteExternalAppUseCase(new MongooseExternalAppRepository());
}
```

- [ ] **Step 2: Create `src/infrastructure/lib/verifyLiffToken.ts`**

```typescript
// Verifies a LINE ID token issued by LIFF and returns the userId.
// Calls LINE's token verification endpoint server-side.
export async function verifyLiffToken(idToken: string): Promise<string> {
  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LIFF_ID!.split('-')[0], // channel ID portion
    }),
  });

  if (!res.ok) {
    throw new Error('Invalid LIFF token');
  }

  const data = await res.json();
  if (!data.sub) throw new Error('Invalid LIFF token: missing sub');
  return data.sub as string; // LINE userId
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/lib/container.ts src/infrastructure/lib/verifyLiffToken.ts
git commit -m "feat: add DI container and LIFF token verification"
```

---

## Task 7: Application — Zod DTOs

**Files:**
- Create: `src/application/dtos/BillTemplateDto.ts`
- Create: `src/application/dtos/ExternalAppDto.ts`

- [ ] **Step 1: Create `src/application/dtos/BillTemplateDto.ts`**

```typescript
import { z } from 'zod';

export const CreateBillTemplateDtoSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  dueDay: z.number().int().min(1).max(31),
  paymentAppId: z.string().min(1),
  billingAppId: z.string().min(1).nullable().optional(),
  reminderDays: z.array(z.number().int().min(1)).default([3, 1]),
});

export const UpdateBillTemplateDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  paymentAppId: z.string().min(1).optional(),
  billingAppId: z.string().min(1).nullable().optional(),
  reminderDays: z.array(z.number().int().min(1)).optional(),
});

export type CreateBillTemplateDto = z.infer<typeof CreateBillTemplateDtoSchema>;
export type UpdateBillTemplateDto = z.infer<typeof UpdateBillTemplateDtoSchema>;
```

- [ ] **Step 2: Create `src/application/dtos/ExternalAppDto.ts`**

```typescript
import { z } from 'zod';

const APP_TYPES = ['billing', 'payment'] as const;

export const CreateExternalAppDtoSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url(),
  deepLink: z.string().min(1).nullable().optional(),
  webUrl: z.string().url().nullable().optional(),
  appType: z.array(z.enum(APP_TYPES)).min(1),
  ownerId: z.string().min(1),
});

export type CreateExternalAppDto = z.infer<typeof CreateExternalAppDtoSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add src/application/dtos/
git commit -m "feat: add Zod DTO schemas"
```

---

## Task 8: Application — Use Cases (Core Bot)

**Files:**
- Create: `src/application/use-cases/MarkBillPaidUseCase.ts`
- Create: `src/application/use-cases/GenerateMonthlyBillsUseCase.ts`
- Create: `src/application/use-cases/SendBillRemindersUseCase.ts`

- [ ] **Step 1: Create `src/application/use-cases/MarkBillPaidUseCase.ts`**

```typescript
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { ILineMessagingService } from '@/domain/services/ILineMessagingService';
import { formatThaiDate } from '@/infrastructure/line/FlexMessageBuilder';

export class MarkBillPaidUseCase {
  constructor(
    private instanceRepo: IBillInstanceRepository,
    private lineService: ILineMessagingService
  ) {}

  async execute(instanceId: string, replyToken: string): Promise<void> {
    const instance = await this.instanceRepo.findById(instanceId);

    if (!instance) {
      await this.lineService.replyText(replyToken, 'ไม่พบบิลนี้');
      return;
    }

    if (instance.isPaid && instance.paidAt) {
      const dateStr = formatThaiDate(
        instance.paidAt.getDate(),
        instance.paidAt.getMonth() + 1,
        instance.paidAt.getFullYear()
      );
      await this.lineService.replyText(replyToken, `จ่ายไปแล้วเมื่อ ${dateStr}`);
      return;
    }

    await this.instanceRepo.markPaid(instanceId, new Date());
    await this.lineService.replyText(replyToken, `✅ บันทึกการจ่าย ${instance.name} แล้ว`);
  }
}
```

- [ ] **Step 2: Create `src/application/use-cases/GenerateMonthlyBillsUseCase.ts`**

```typescript
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalAppSnapshot } from '@/domain/entities/ExternalApp';

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export class GenerateMonthlyBillsUseCase {
  constructor(
    private templateRepo: IBillTemplateRepository,
    private instanceRepo: IBillInstanceRepository,
    private externalAppRepo: IExternalAppRepository
  ) {}

  async execute(month: number, year: number): Promise<{ created: number; skipped: number }> {
    const templates = await this.templateRepo.findAll();
    let created = 0;
    let skipped = 0;

    for (const template of templates) {
      const alreadyExists = await this.instanceRepo.existsByTemplateMonthYear(
        template.id, month, year
      );
      if (alreadyExists) { skipped++; continue; }

      const clampedDueDay = Math.min(template.dueDay, daysInMonth(month, year));

      const paymentApp = await this.externalAppRepo.findById(template.paymentAppId);
      if (!paymentApp) { skipped++; continue; }

      const paymentAppSnapshot: IExternalAppSnapshot = {
        name: paymentApp.name,
        logoUrl: paymentApp.logoUrl,
        deepLink: paymentApp.deepLink,
        webUrl: paymentApp.webUrl,
      };

      let billingAppSnapshot: IExternalAppSnapshot | null = null;
      if (template.billingAppId) {
        const billingApp = await this.externalAppRepo.findById(template.billingAppId);
        if (billingApp) {
          billingAppSnapshot = {
            name: billingApp.name,
            logoUrl: billingApp.logoUrl,
            deepLink: billingApp.deepLink,
            webUrl: billingApp.webUrl,
          };
        }
      }

      await this.instanceRepo.create({
        templateId: template.id,
        userId: template.userId,
        name: template.name,
        dueDay: clampedDueDay,
        month,
        year,
        isPaid: false,
        paidAt: null,
        reminderDays: template.reminderDays,
        paymentAppSnapshot,
        billingAppSnapshot,
      });
      created++;
    }

    return { created, skipped };
  }
}
```

- [ ] **Step 3: Create `src/application/use-cases/SendBillRemindersUseCase.ts`**

```typescript
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { ILineMessagingService, IFlexBubble } from '@/domain/services/ILineMessagingService';
import { IBillInstance } from '@/domain/entities/BillInstance';
import { formatThaiDate } from '@/infrastructure/line/FlexMessageBuilder';

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function shouldRemindToday(instance: IBillInstance, todayDay: number, todayMonth: number, todayYear: number): boolean {
  for (const reminderDay of instance.reminderDays) {
    const diff = instance.dueDay - reminderDay;

    if (diff >= 1) {
      // Same-month case
      if (instance.month === todayMonth && instance.year === todayYear && diff === todayDay) return true;
    } else {
      // Cross-month case: reminder fires in previous month
      const prevMonth = instance.month === 1 ? 12 : instance.month - 1;
      const prevYear = instance.month === 1 ? instance.year - 1 : instance.year;
      const reminderDayInPrevMonth = daysInMonth(prevMonth, prevYear) + diff;
      if (prevMonth === todayMonth && prevYear === todayYear && reminderDayInPrevMonth === todayDay) return true;
    }
  }
  return false;
}

export class SendBillRemindersUseCase {
  constructor(
    private instanceRepo: IBillInstanceRepository,
    private lineService: ILineMessagingService
  ) {}

  async execute(today: Date): Promise<void> {
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    const candidates = await this.instanceRepo.findUnpaidForReminder(todayMonth, todayYear);

    const matching = candidates.filter((inst) =>
      shouldRemindToday(inst, todayDay, todayMonth, todayYear)
    );

    // Group by userId
    const byUser = new Map<string, IBillInstance[]>();
    for (const inst of matching) {
      const list = byUser.get(inst.userId) ?? [];
      list.push(inst);
      byUser.set(inst.userId, list);
    }

    for (const [userId, instances] of byUser) {
      try {
        const bubbles: IFlexBubble[] = instances.map((inst) => {
          const daysLeft = inst.dueDay - todayDay;
          return {
            instanceId: inst.id,
            billName: inst.name,
            dueDate: formatThaiDate(inst.dueDay, inst.month, inst.year),
            daysLeft,
            paymentApp: inst.paymentAppSnapshot,
            billingApp: inst.billingAppSnapshot,
          };
        });
        await this.lineService.sendFlexCarousel(userId, bubbles);
      } catch (err) {
        console.error(`Failed to send reminder to ${userId}:`, err);
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/application/use-cases/MarkBillPaidUseCase.ts \
        src/application/use-cases/GenerateMonthlyBillsUseCase.ts \
        src/application/use-cases/SendBillRemindersUseCase.ts
git commit -m "feat: add core bot use cases (mark paid, generate, remind)"
```

---

## Task 9: Application — LIFF Use Cases

**Files:**
- Create: `src/application/use-cases/GetBillTemplatesUseCase.ts`
- Create: `src/application/use-cases/CreateBillTemplateUseCase.ts`
- Create: `src/application/use-cases/UpdateBillTemplateUseCase.ts`
- Create: `src/application/use-cases/DeleteBillTemplateUseCase.ts`
- Create: `src/application/use-cases/GetBillInstancesUseCase.ts`
- Create: `src/application/use-cases/GetExternalAppsUseCase.ts`
- Create: `src/application/use-cases/CreateExternalAppUseCase.ts`
- Create: `src/application/use-cases/DeleteExternalAppUseCase.ts`

- [ ] **Step 1: Create `src/application/use-cases/GetBillTemplatesUseCase.ts`**

```typescript
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

export class GetBillTemplatesUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(userId: string): Promise<IBillTemplate[]> {
    return this.repo.findByUserId(userId);
  }
}
```

- [ ] **Step 2: Create `src/application/use-cases/CreateBillTemplateUseCase.ts`**

```typescript
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { CreateBillTemplateDto } from '@/application/dtos/BillTemplateDto';

export class CreateBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(dto: CreateBillTemplateDto): Promise<IBillTemplate> {
    return this.repo.create({
      userId: dto.userId,
      name: dto.name,
      dueDay: dto.dueDay,
      paymentAppId: dto.paymentAppId,
      billingAppId: dto.billingAppId ?? null,
      reminderDays: dto.reminderDays,
    });
  }
}
```

- [ ] **Step 3: Create `src/application/use-cases/UpdateBillTemplateUseCase.ts`**

```typescript
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { UpdateBillTemplateDto } from '@/application/dtos/BillTemplateDto';

export class UpdateBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(id: string, userId: string, dto: UpdateBillTemplateDto): Promise<IBillTemplate> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
    if (existing.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    const updated = await this.repo.update(id, dto);
    if (!updated) throw Object.assign(new Error('Not found'), { status: 404 });
    return updated;
  }
}
```

- [ ] **Step 4: Create `src/application/use-cases/DeleteBillTemplateUseCase.ts`**

```typescript
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';

export class DeleteBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
    if (existing.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.repo.deleteById(id);
  }
}
```

- [ ] **Step 5: Create `src/application/use-cases/GetBillInstancesUseCase.ts`**

```typescript
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IBillInstance } from '@/domain/entities/BillInstance';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

export class GetBillInstancesUseCase {
  constructor(private repo: IBillInstanceRepository) {}

  async execute(userId: string, month?: number, year?: number): Promise<IBillInstance[]> {
    const now = toZonedTime(new Date(), BANGKOK_TZ);
    const resolvedMonth = month ?? now.getMonth() + 1;
    const resolvedYear = year ?? now.getFullYear();
    return this.repo.findByUserMonthYear(userId, resolvedMonth, resolvedYear);
  }
}
```

- [ ] **Step 6: Create `src/application/use-cases/GetExternalAppsUseCase.ts`**

```typescript
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';

export class GetExternalAppsUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(userId: string, appType?: string): Promise<IExternalApp[]> {
    return this.repo.findByUserAndType(userId, appType);
  }
}
```

- [ ] **Step 7: Create `src/application/use-cases/CreateExternalAppUseCase.ts`**

```typescript
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';
import { CreateExternalAppDto } from '@/application/dtos/ExternalAppDto';

export class CreateExternalAppUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(dto: CreateExternalAppDto): Promise<IExternalApp> {
    return this.repo.create({
      name: dto.name,
      slug: dto.slug,
      logoUrl: dto.logoUrl,
      deepLink: dto.deepLink ?? null,
      webUrl: dto.webUrl ?? null,
      appType: dto.appType,
      isSystem: false,
      ownerId: dto.ownerId,
    });
  }
}
```

- [ ] **Step 8: Create `src/application/use-cases/DeleteExternalAppUseCase.ts`**

```typescript
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';

export class DeleteExternalAppUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const app = await this.repo.findById(id);
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    if (app.isSystem) throw Object.assign(new Error('Cannot delete system app'), { status: 403 });
    if (app.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.repo.deleteById(id);
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add src/application/use-cases/
git commit -m "feat: add LIFF use cases for bills and external apps"
```

---

## Task 10: API Route Handlers — Webhook & Cron

**Files:**
- Create: `app/api/webhook/route.ts`
- Create: `app/api/cron/generate/route.ts`
- Create: `app/api/cron/remind/route.ts`

- [ ] **Step 1: Create `app/api/webhook/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateSignature } from '@line/bot-sdk';
import { makeMarkBillPaidUseCase } from '@/infrastructure/lib/container';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get('x-line-signature') ?? '';

  const isValid = validateSignature(
    body,
    process.env.LINE_CHANNEL_SECRET!,
    signature
  );
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const payload = JSON.parse(body);
  const useCase = makeMarkBillPaidUseCase();

  for (const event of payload.events ?? []) {
    if (event.type === 'postback' && event.postback?.data?.startsWith('MARK_PAID:')) {
      const instanceId = event.postback.data.replace('MARK_PAID:', '');
      await useCase.execute(instanceId, event.replyToken);
    }
    // All other event types: silently ignore
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `app/api/cron/generate/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { makeGenerateMonthlyBillsUseCase } from '@/infrastructure/lib/container';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = toZonedTime(new Date(), BANGKOK_TZ);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const useCase = makeGenerateMonthlyBillsUseCase();
  const result = await useCase.execute(month, year);

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Create `app/api/cron/remind/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { makeSendBillRemindersUseCase } from '@/infrastructure/lib/container';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = toZonedTime(new Date(), BANGKOK_TZ);
  const useCase = makeSendBillRemindersUseCase();
  await useCase.execute(today);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/webhook/ app/api/cron/
git commit -m "feat: add webhook and cron route handlers"
```

---

## Task 11: API Route Handlers — Bills & External Apps CRUD

**Files:**
- Create: `app/api/bills/route.ts`
- Create: `app/api/bills/[id]/route.ts`
- Create: `app/api/external-apps/route.ts`
- Create: `app/api/external-apps/[id]/route.ts`

- [ ] **Step 1: Create `app/api/bills/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import {
  makeGetBillTemplatesUseCase,
  makeCreateBillTemplateUseCase,
} from '@/infrastructure/lib/container';
import { CreateBillTemplateDtoSchema } from '@/application/dtos/BillTemplateDto';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeGetBillTemplatesUseCase();
    const templates = await useCase.execute(userId);
    return NextResponse.json(templates);
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const body = await req.json();
    const parsed = CreateBillTemplateDtoSchema.safeParse({ ...body, userId });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    const useCase = makeCreateBillTemplateUseCase();
    const template = await useCase.execute(parsed.data);
    return NextResponse.json(template, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/bills/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import {
  makeUpdateBillTemplateUseCase,
  makeDeleteBillTemplateUseCase,
} from '@/infrastructure/lib/container';
import { UpdateBillTemplateDtoSchema } from '@/application/dtos/BillTemplateDto';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const body = await req.json();
    const parsed = UpdateBillTemplateDtoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    const useCase = makeUpdateBillTemplateUseCase();
    const updated = await useCase.execute(params.id, userId, parsed.data);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (err.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeDeleteBillTemplateUseCase();
    await useCase.execute(params.id, userId);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (err.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `app/api/external-apps/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import {
  makeGetExternalAppsUseCase,
  makeCreateExternalAppUseCase,
} from '@/infrastructure/lib/container';
import { CreateExternalAppDtoSchema } from '@/application/dtos/ExternalAppDto';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const appType = req.nextUrl.searchParams.get('appType') ?? undefined;
    const useCase = makeGetExternalAppsUseCase();
    const apps = await useCase.execute(userId, appType);
    return NextResponse.json(apps);
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const body = await req.json();
    const parsed = CreateExternalAppDtoSchema.safeParse({ ...body, ownerId: userId });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    const useCase = makeCreateExternalAppUseCase();
    const app = await useCase.execute(parsed.data);
    return NextResponse.json(app, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create `app/api/external-apps/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import { makeDeleteExternalAppUseCase } from '@/infrastructure/lib/container';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeDeleteExternalAppUseCase();
    await useCase.execute(params.id, userId);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (err.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/bills/ app/api/external-apps/
git commit -m "feat: add LIFF CRUD route handlers for bills and external apps"
```

---

## Task 12: Presentation — Shared Components

**Files:**
- Create: `src/presentation/components/AppPicker.tsx`
- Create: `src/presentation/components/ReminderDaysPicker.tsx`
- Create: `src/presentation/components/BillCard.tsx`
- Create: `src/presentation/components/InstanceStatusBadge.tsx`

- [ ] **Step 1: Create `src/presentation/components/AppPicker.tsx`**

```tsx
'use client';
import { IExternalApp } from '@/domain/entities/ExternalApp';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface AppPickerProps {
  apps: IExternalApp[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  required?: boolean;
  label: string;
}

export function AppPicker({ apps, selectedId, onChange, required, label }: AppPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {!required && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              selectedId === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-muted text-muted-foreground'
            }`}
          >
            ไม่เลือก
          </button>
        )}
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onChange(app.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
              selectedId === app.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-muted text-muted-foreground'
            }`}
          >
            {app.logoUrl && (
              <Image src={app.logoUrl} alt={app.name} width={16} height={16} className="rounded-full" />
            )}
            {app.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/presentation/components/ReminderDaysPicker.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReminderDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function ReminderDaysPicker({ value, onChange }: ReminderDaysPickerProps) {
  const [input, setInput] = useState('');

  function addDay() {
    const n = parseInt(input, 10);
    if (isNaN(n) || n < 1 || value.includes(n)) return;
    onChange([...value, n].sort((a, b) => b - a));
    setInput('');
  }

  function removeDay(day: number) {
    onChange(value.filter((d) => d !== day));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">แจ้งเตือนล่วงหน้า (วัน)</p>
      <div className="flex flex-wrap gap-2">
        {value.map((day) => (
          <Badge
            key={day}
            variant="secondary"
            className="cursor-pointer gap-1"
            onClick={() => removeDay(day)}
          >
            {day} วัน ✕
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          placeholder="เช่น 7"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-24"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDay())}
        />
        <Button type="button" variant="outline" size="sm" onClick={addDay}>
          + เพิ่ม
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/presentation/components/BillCard.tsx`**

```tsx
'use client';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BillCardProps {
  template: IBillTemplate;
  onDelete: (id: string) => void;
}

export function BillCard({ template, onDelete }: BillCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-semibold">{template.name}</p>
          <p className="text-sm text-muted-foreground">ครบกำหนด: วันที่ {template.dueDay} ทุกเดือน</p>
          <p className="text-sm text-muted-foreground">
            แจ้งเตือน: {template.reminderDays.join(', ')} วันก่อน
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/liff/bills/${template.id}/edit`}>✏️</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(template.id)}
          >
            🗑️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create `src/presentation/components/InstanceStatusBadge.tsx`**

```tsx
import { IBillInstance } from '@/domain/entities/BillInstance';
import { Badge } from '@/components/ui/badge';

interface InstanceStatusBadgeProps {
  instance: IBillInstance;
  todayDay: number;
}

export function InstanceStatusBadge({ instance, todayDay }: InstanceStatusBadgeProps) {
  if (instance.isPaid) {
    return <Badge className="bg-green-500 text-white">✓ จ่ายแล้ว</Badge>;
  }
  const daysLeft = instance.dueDay - todayDay;
  if (daysLeft <= 1) {
    return <Badge className="bg-red-500 text-white">⏳ ยังไม่จ่าย</Badge>;
  }
  return <Badge className="bg-amber-500 text-white">⏳ ยังไม่จ่าย</Badge>;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/
git commit -m "feat: add shared LIFF UI components"
```

---

## Task 13: LIFF Pages

**Files:**
- Create: `app/liff/layout.tsx`
- Create: `app/liff/bills/page.tsx`
- Create: `app/liff/bills/new/page.tsx`
- Create: `app/liff/bills/[id]/edit/page.tsx`
- Create: `app/liff/history/page.tsx`

- [ ] **Step 1: Create `app/liff/layout.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(() => {
        if (!liff.isInClient() && !liff.isLoggedIn()) {
          liff.login();
          return;
        }
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!ready) return <div className="flex h-screen items-center justify-center">กำลังโหลด...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background flex">
        <Link
          href="/liff/bills"
          className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 ${pathname.startsWith('/liff/bills') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <span>📋</span>บิล
        </Link>
        <Link
          href="/liff/history"
          className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 ${pathname === '/liff/history' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <span>📅</span>ประวัติ
        </Link>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_LIFF_ID` to `.env.example` and `.env.local`**

```env
# Add this line to .env.example and .env.local
NEXT_PUBLIC_LIFF_ID=your_liff_id_here
```

- [ ] **Step 3: Create `app/liff/bills/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BillCard } from '@/presentation/components/BillCard';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

async function getToken(): Promise<string> {
  return liff.getIDToken() ?? '';
}

export default function BillsPage() {
  const [templates, setTemplates] = useState<IBillTemplate[]>([]);

  async function load() {
    const token = await getToken();
    const res = await fetch('/api/bills', { headers: { 'x-liff-token': token } });
    if (res.ok) setTemplates(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('ลบบิลนี้?')) return;
    const token = await getToken();
    await fetch(`/api/bills/${id}`, { method: 'DELETE', headers: { 'x-liff-token': token } });
    load();
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">💳 บิลของฉัน</h1>
        <Button size="sm" asChild>
          <Link href="/liff/bills/new">+ เพิ่มบิล</Link>
        </Button>
      </div>
      {templates.length === 0 && (
        <p className="text-center text-muted-foreground py-8">ยังไม่มีบิล กด + เพิ่มบิลได้เลย</p>
      )}
      {templates.map((t) => (
        <BillCard key={t.id} template={t} onDelete={handleDelete} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `app/liff/bills/new/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import liff from '@line/liff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppPicker } from '@/presentation/components/AppPicker';
import { ReminderDaysPicker } from '@/presentation/components/ReminderDaysPicker';
import { IExternalApp } from '@/domain/entities/ExternalApp';

async function getToken() { return liff.getIDToken() ?? ''; }

export default function NewBillPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [paymentAppId, setPaymentAppId] = useState<string | null>(null);
  const [billingAppId, setBillingAppId] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([3, 1]);
  const [paymentApps, setPaymentApps] = useState<IExternalApp[]>([]);
  const [billingApps, setBillingApps] = useState<IExternalApp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadApps() {
      const token = await getToken();
      const headers = { 'x-liff-token': token };
      const [pa, ba] = await Promise.all([
        fetch('/api/external-apps?appType=payment', { headers }).then((r) => r.json()),
        fetch('/api/external-apps?appType=billing', { headers }).then((r) => r.json()),
      ]);
      setPaymentApps(pa);
      setBillingApps(ba);
    }
    loadApps();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentAppId) return alert('กรุณาเลือกแอพจ่ายเงิน');
    setSaving(true);
    const token = await getToken();
    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-liff-token': token },
      body: JSON.stringify({ name, dueDay, paymentAppId, billingAppId, reminderDays }),
    });
    setSaving(false);
    if (res.ok) router.push('/liff/bills');
    else alert('เกิดข้อผิดพลาด');
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground">←</button>
        <h1 className="text-xl font-bold">เพิ่มบิลใหม่</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>ชื่อบิล</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น Netflix, ค่าไฟ" />
        </div>
        <div className="space-y-1">
          <Label>วันครบกำหนด (1–31)</Label>
          <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} required />
        </div>
        <AppPicker apps={billingApps} selectedId={billingAppId} onChange={setBillingAppId} label="แอพดูยอด (ไม่บังคับ)" />
        <AppPicker apps={paymentApps} selectedId={paymentAppId} onChange={setPaymentAppId} required label="แอพจ่ายเงิน *" />
        <ReminderDaysPicker value={reminderDays} onChange={setReminderDays} />
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create `app/liff/bills/[id]/edit/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import liff from '@line/liff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppPicker } from '@/presentation/components/AppPicker';
import { ReminderDaysPicker } from '@/presentation/components/ReminderDaysPicker';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { IExternalApp } from '@/domain/entities/ExternalApp';

async function getToken() { return liff.getIDToken() ?? ''; }

export default function EditBillPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [paymentAppId, setPaymentAppId] = useState<string | null>(null);
  const [billingAppId, setBillingAppId] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([3, 1]);
  const [paymentApps, setPaymentApps] = useState<IExternalApp[]>([]);
  const [billingApps, setBillingApps] = useState<IExternalApp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const headers = { 'x-liff-token': token };
      const [templates, pa, ba] = await Promise.all([
        fetch('/api/bills', { headers }).then((r) => r.json()),
        fetch('/api/external-apps?appType=payment', { headers }).then((r) => r.json()),
        fetch('/api/external-apps?appType=billing', { headers }).then((r) => r.json()),
      ]);
      const template: IBillTemplate | undefined = templates.find((t: IBillTemplate) => t.id === id);
      if (template) {
        setName(template.name);
        setDueDay(template.dueDay);
        setPaymentAppId(template.paymentAppId);
        setBillingAppId(template.billingAppId);
        setReminderDays(template.reminderDays);
      }
      setPaymentApps(pa);
      setBillingApps(ba);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = await getToken();
    const res = await fetch(`/api/bills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-liff-token': token },
      body: JSON.stringify({ name, dueDay, paymentAppId, billingAppId, reminderDays }),
    });
    setSaving(false);
    if (res.ok) router.push('/liff/bills');
    else alert('เกิดข้อผิดพลาด');
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground">←</button>
        <h1 className="text-xl font-bold">แก้ไขบิล</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>ชื่อบิล</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>วันครบกำหนด (1–31)</Label>
          <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} required />
        </div>
        <AppPicker apps={billingApps} selectedId={billingAppId} onChange={setBillingAppId} label="แอพดูยอด (ไม่บังคับ)" />
        <AppPicker apps={paymentApps} selectedId={paymentAppId} onChange={setPaymentAppId} required label="แอพจ่ายเงิน *" />
        <ReminderDaysPicker value={reminderDays} onChange={setReminderDays} />
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Create `app/liff/history/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { toZonedTime } from 'date-fns-tz';
import { Card, CardContent } from '@/components/ui/card';
import { InstanceStatusBadge } from '@/presentation/components/InstanceStatusBadge';
import { IBillInstance } from '@/domain/entities/BillInstance';

const BANGKOK_TZ = 'Asia/Bangkok';
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

async function getToken() { return liff.getIDToken() ?? ''; }

export default function HistoryPage() {
  const now = toZonedTime(new Date(), BANGKOK_TZ);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [instances, setInstances] = useState<IBillInstance[]>([]);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const res = await fetch(`/api/bills/instances?month=${month}&year=${year}`, {
        headers: { 'x-liff-token': token },
      });
      if (res.ok) setInstances(await res.json());
    }
    load();
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const todayDay = now.getDate();

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">📅 ประวัติการจ่าย</h1>
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="text-muted-foreground px-2">‹</button>
        <span className="font-medium">{THAI_MONTHS[month - 1]} {year + 543}</span>
        <button onClick={nextMonth} className="text-muted-foreground px-2">›</button>
      </div>
      {instances.length === 0 && (
        <p className="text-center text-muted-foreground py-8">ไม่มีบิลในเดือนนี้</p>
      )}
      <div className="space-y-2">
        {instances.map((inst) => (
          <Card key={inst.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{inst.name}</p>
                <p className="text-sm text-muted-foreground">ครบกำหนด {inst.dueDay} {THAI_MONTHS[inst.month - 1]}</p>
              </div>
              <InstanceStatusBadge instance={inst} todayDay={todayDay} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add `GET /api/bills/instances` route for history**

Create `app/api/bills/instances/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import { makeGetBillInstancesUseCase } from '@/infrastructure/lib/container';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const month = req.nextUrl.searchParams.get('month');
    const year = req.nextUrl.searchParams.get('year');
    const useCase = makeGetBillInstancesUseCase();
    const instances = await useCase.execute(
      userId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );
    return NextResponse.json(instances);
  } catch (err: any) {
    if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add app/liff/ app/api/bills/instances/
git commit -m "feat: add LIFF pages (bills list, add/edit, history)"
```

---

## Task 14: Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create `scripts/seed.ts`**

```typescript
import mongoose from 'mongoose';
import 'dotenv/config';
import { ExternalAppModel } from '../src/infrastructure/db/models/ExternalAppModel';
import { BillTemplateModel } from '../src/infrastructure/db/models/BillTemplateModel';
import { BillInstanceModel } from '../src/infrastructure/db/models/BillInstanceModel';

const MONGODB_URI = process.env.MONGODB_URI!;

const externalApps = [
  // Payment only
  { name: 'K PLUS',         slug: 'kplus',    logoUrl: 'https://placehold.co/32x32?text=K',  deepLink: 'kplus://',    webUrl: 'https://kplus.kasikornbank.com',   appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'SCB Easy',       slug: 'scbeasy',  logoUrl: 'https://placehold.co/32x32?text=S',  deepLink: 'scbeasy://', webUrl: 'https://scbeasy.com',              appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'BBL Mobile',     slug: 'bbl',      logoUrl: 'https://placehold.co/32x32?text=B',  deepLink: 'bbl://',     webUrl: 'https://www.bangkokbank.com',       appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'Krungthai NEXT', slug: 'ktb',      logoUrl: 'https://placehold.co/32x32?text=KT', deepLink: 'ktb://',     webUrl: 'https://www.ktb.co.th',            appType: ['payment'], isSystem: true, ownerId: null },
  // Billing only
  { name: 'AIS',    slug: 'ais',      logoUrl: 'https://placehold.co/32x32?text=A',  deepLink: 'ais://',     webUrl: 'https://www.ais.th/myais/',  appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'True',   slug: 'true',     logoUrl: 'https://placehold.co/32x32?text=T',  deepLink: 'true://',    webUrl: 'https://www.true.th',        appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'DTAC',   slug: 'dtac',     logoUrl: 'https://placehold.co/32x32?text=D',  deepLink: 'dtac://',    webUrl: 'https://www.dtac.co.th',     appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'UChoose',slug: 'uchoose',  logoUrl: 'https://placehold.co/32x32?text=U',  deepLink: null,         webUrl: 'https://uchoose.in.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'กฟน.',   slug: 'mea',      logoUrl: 'https://placehold.co/32x32?text=M',  deepLink: null,         webUrl: 'https://www.mea.or.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'กปภ.',   slug: 'pwa',      logoUrl: 'https://placehold.co/32x32?text=P',  deepLink: null,         webUrl: 'https://www.pwa.co.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'NT',     slug: 'nt',       logoUrl: 'https://placehold.co/32x32?text=N',  deepLink: null,         webUrl: 'https://www.ntplc.co.th',    appType: ['billing'], isSystem: true, ownerId: null },
  // Both
  { name: 'TrueMoney', slug: 'truemoney', logoUrl: 'https://placehold.co/32x32?text=TM', deepLink: 'tmw://',     webUrl: 'https://www.truemoney.com',  appType: ['billing', 'payment'], isSystem: true, ownerId: null },
  { name: 'Shopee Pay', slug: 'shopee',  logoUrl: 'https://placehold.co/32x32?text=SP', deepLink: 'shopee://',  webUrl: 'https://shopee.co.th/pay',   appType: ['billing', 'payment'], isSystem: true, ownerId: null },
  { name: 'PromptPay',  slug: 'promptpay',logoUrl: 'https://placehold.co/32x32?text=PP',deepLink: null,         webUrl: 'https://www.promptpay.io',   appType: ['billing', 'payment'], isSystem: true, ownerId: null },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await ExternalAppModel.deleteMany({ isSystem: true });
  await BillInstanceModel.deleteMany({});
  await BillTemplateModel.deleteMany({});

  const inserted = await ExternalAppModel.insertMany(externalApps);
  console.log(`Inserted ${inserted.length} external apps`);

  const kplus = inserted.find((a) => a.slug === 'kplus')!;
  const scbeasy = inserted.find((a) => a.slug === 'scbeasy')!;
  const ais = inserted.find((a) => a.slug === 'ais')!;
  const truemoney = inserted.find((a) => a.slug === 'truemoney')!;
  const shopee = inserted.find((a) => a.slug === 'shopee')!;

  await BillTemplateModel.insertMany([
    { userId: 'Uabc123', name: 'Netflix',    dueDay: 5,  paymentAppId: kplus._id,      billingAppId: null,       reminderDays: [3, 1] },
    { userId: 'Uabc123', name: 'ค่าไฟ',      dueDay: 15, paymentAppId: scbeasy._id,    billingAppId: null,       reminderDays: [3, 1] },
    { userId: 'Uabc123', name: 'AIS',        dueDay: 20, paymentAppId: truemoney._id,  billingAppId: ais._id,    reminderDays: [7, 3, 1] },
    { userId: 'Uxyz456', name: 'Shopee',     dueDay: 10, paymentAppId: shopee._id,     billingAppId: shopee._id, reminderDays: [3] },
    { userId: 'Uxyz456', name: 'TrueMoney',  dueDay: 25, paymentAppId: truemoney._id,  billingAppId: null,       reminderDays: [3, 1] },
  ]);
  console.log('Inserted 5 bill templates');

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Add seed script to `package.json`**

In `package.json`, add to the `"scripts"` section:
```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 3: Run the seed to verify**

```bash
npm run seed
```

Expected output:
```
Connected to MongoDB
Inserted 14 external apps
Inserted 5 bill templates
Done
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "feat: add seed script with external apps and sample templates"
```

---

## Task 15: Final Configuration & Deployment

**Files:**
- Modify: `next.config.ts`
- Modify: `tsconfig.json` (verify path aliases)

- [ ] **Step 1: Verify `tsconfig.json` path alias**

Ensure `tsconfig.json` contains:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 2: Update `next.config.ts` for LIFF**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Run local dev server to verify**

```bash
npm run dev
```

Open http://localhost:3000 — no build errors expected.

- [ ] **Step 4: Add `.gitignore` entries**

Ensure `.gitignore` contains:
```
.env.local
.superpowers/
```

- [ ] **Step 5: Final commit**

```bash
git add next.config.ts tsconfig.json .gitignore
git commit -m "chore: final config for LIFF images and path aliases"
```

- [ ] **Step 6: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `MONGODB_URI`
- `CRON_SECRET`
- `LIFF_ID`
- `NEXT_PUBLIC_LIFF_ID`

- [ ] **Step 7: Register webhook URL in LINE Developers Console**

Set webhook URL to: `https://<your-vercel-domain>/api/webhook`

- [ ] **Step 8: Register LIFF URL in LINE Developers Console**

Set LIFF endpoint URL to: `https://<your-vercel-domain>/liff/bills`

---

## Self-Review Checklist

- [x] Spec Section 1 (Architecture) → Task 1 scaffold + folder structure
- [x] Spec Section 2 (Data Models) → Tasks 2, 3 (entities, models)
- [x] Spec Section 2 (externalApps merged) → Task 3 ExternalAppModel with `appType[]`
- [x] Spec Section 3 (API Routes) → Tasks 10, 11 route handlers
- [x] Spec Section 3 (Use Cases) → Tasks 8, 9 use cases
- [x] Spec Section 4 (LIFF UI) → Tasks 12, 13 components + pages
- [x] Spec Section 5 (Flex Message) → Task 5 FlexMessageBuilder
- [x] Spec Section 6 (Error handling) → All route handlers + use cases include guards
- [x] Spec Section 7 (Seed + config) → Tasks 14, 15
- [x] Cross-month reminder logic → `SendBillRemindersUseCase` + `findUnpaidForReminder`
- [x] dueDay clamping → `GenerateMonthlyBillsUseCase`
- [x] Snapshot pattern → `GenerateMonthlyBillsUseCase` resolves app snapshots at generation time
- [x] LIFF token auth → `verifyLiffToken` used in all LIFF routes
- [x] CRON_SECRET guard → both cron routes
- [x] History route `/api/bills/instances` added in Task 13 Step 7
