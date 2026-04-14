# UI/UX Polish — Incremental Design Spec
Date: 2026-04-14
Approach: A — Incremental Polish
Style: Clean & Minimal (white/grey, Thai banking app feel)
Platform: LIFF in LINE, mobile-first

---

## 1. Bottom Navigation (`app/liff/layout.tsx`)

**Current:** Emoji icons (📋📅), no active indicator beyond text color.

**Change:**
- Replace emoji with Lucide icons: `Receipt` (บิล), `Clock` (ประวัติ)
- Icon size: 20px
- Active tab: icon + label in `text-foreground` (dark), add a 2px top border accent in `primary` color
- Inactive: `text-muted-foreground`
- No other structural changes

---

## 2. BillCard (`src/presentation/components/BillCard.tsx`)

**Current:** Plain card, emoji buttons, two lines of small muted text.

**Change:**
- Add `border-l-4 border-l-primary` left accent on card
- Bill name: `font-semibold text-base` (slightly larger)
- Combine due date + reminder days onto one line: `วันที่ {dueDay} · แจ้งเตือน {days} วันก่อน`
- Replace emoji edit/delete with Lucide `Pencil` and `Trash2` icons (16px)
- Edit button: `text-muted-foreground hover:text-foreground`
- Delete button: `text-muted-foreground hover:text-destructive`

---

## 3. Bills List Page (`app/liff/bills/page.tsx`)

**Current:** Small "+ เพิ่มบิล" link button in header top-right.

**Change:**
- Remove the link from the header
- Add FAB (Floating Action Button): fixed position, bottom-20 right-4 (above nav bar), 56px circle, `bg-primary text-primary-foreground shadow-lg`
- FAB content: Lucide `Plus` icon (24px)
- FAB aria-label: "เพิ่มบิล"
- Empty state: add Lucide `ReceiptText` icon (48px, muted), heading "ยังไม่มีบิล", subtext "กดปุ่ม + ด้านล่างเพื่อเพิ่มบิลแรก"
- Replace loading text with 3x skeleton cards (same height as BillCard)

---

## 4. Due Day Picker in New/Edit Form

**Current:** `<Input type="number" min={1} max={31}>` — user must type manually.

**Change:**
- Replace with a 7-column grid of buttons (1–31 + filler cells for alignment)
- Each cell: 36×36px, rounded-md, `text-sm`
- Selected: `bg-primary text-primary-foreground`
- Unselected: `border border-input hover:bg-muted`
- Extract as `DueDayPicker` component in `src/presentation/components/DueDayPicker.tsx`
- Used in both `new/page.tsx` and `[id]/edit/page.tsx`

---

## 5. History Page (`app/liff/history/page.tsx`)

**Bug fix:**
- Current: `daysLeft <= 1` shows "เกินกำหนด" — wrong. Fix:
  - `isPaid` → green badge "✓ จ่ายแล้ว"
  - `daysLeft < 0` → red badge "เกินกำหนด"
  - `daysLeft <= 3` → amber badge "ใกล้ครบกำหนด"
  - else → grey badge "รอจ่าย"

**Visual:**
- Row background tint based on status: paid=`bg-green-50`, overdue=`bg-red-50`, upcoming=`bg-amber-50`, default=none
- Month navigator: make prev/next buttons larger tap targets (`w-10 h-10`), show full month+year centered with `font-semibold`

---

## 6. Loading State (layout.tsx)

**Current:** `<div>กำลังโหลด...</div>` centered text.

**Change:**
- Show a centered LINE-green spinner (animate-spin border Lucide `Loader2` icon, 32px, `text-muted-foreground`)

---

## Scope & Constraints

- No new routes or API changes
- No library additions beyond Lucide (already available via `lucide-react` which ships with shadcn)
- All changes are visual only — no logic changes except the status badge bug fix
- Edit page (`app/liff/bills/[id]/edit/page.tsx`) gets same DueDayPicker as new page

---

## Files Affected

| File | Change |
|------|--------|
| `app/liff/layout.tsx` | Lucide nav icons, loading spinner |
| `app/liff/bills/page.tsx` | FAB, empty state, skeleton |
| `app/liff/bills/new/page.tsx` | Use DueDayPicker |
| `app/liff/bills/[id]/edit/page.tsx` | Use DueDayPicker |
| `src/presentation/components/BillCard.tsx` | Left accent, Lucide icons, combined subtext |
| `src/presentation/components/InstanceStatusBadge.tsx` | Bug fix + 4-state logic |
| `src/presentation/components/DueDayPicker.tsx` | New component |
| `app/liff/history/page.tsx` | Row tint, nav tap targets |
