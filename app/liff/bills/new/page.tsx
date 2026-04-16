'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import liff from '@line/liff';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppPicker } from '@/presentation/components/AppPicker';
import { ReminderDaysPicker } from '@/presentation/components/ReminderDaysPicker';
import { DueDayPicker } from '@/presentation/components/DueDayPicker';
import { IconPicker } from '@/presentation/components/IconPicker';
import { IExternalApp } from '@/domain/entities/ExternalApp';

async function getToken() { return liff.getAccessToken() ?? ''; }

export default function NewBillPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [dueDay, setDueDay] = useState(1);
  const [paymentAppId, setPaymentAppId] = useState<string | null>(null);
  const [billingAppId, setBillingAppId] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([3, 1]);
  const [paymentApps, setPaymentApps] = useState<IExternalApp[]>([]);
  const [billingApps, setBillingApps] = useState<IExternalApp[]>([]);
  const [serviceApps, setServiceApps] = useState<IExternalApp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadApps() {
      try {
        const token = await getToken();
        const headers = { 'x-liff-token': token };
        const [pa, ba, sa] = await Promise.all([
          fetch('/api/external-apps?appType=payment', { headers }).then((r) => r.json()),
          fetch('/api/external-apps?appType=billing', { headers }).then((r) => r.json()),
          fetch('/api/external-apps?appType=service', { headers }).then((r) => r.json()),
        ]);
        setPaymentApps(Array.isArray(pa) ? pa : []);
        setBillingApps(Array.isArray(ba) ? ba : []);
        setServiceApps(Array.isArray(sa) ? sa : []);
        console.log({ pa, ba, sa });
      } catch {
        alert('โหลดแอพไม่สำเร็จ');
      }
    }
    loadApps();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentAppId) return alert('กรุณาเลือกแอพจ่ายเงิน');
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-liff-token': token },
        body: JSON.stringify({ name, icon, dueDay, paymentAppId, billingAppId, reminderDays }),
      });
      if (res.ok) router.push('/liff/bills');
      else alert('เกิดข้อผิดพลาด');
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors" aria-label="ย้อนกลับ">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">เพิ่มบิลใหม่</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ข้อมูลพื้นฐาน */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ข้อมูลพื้นฐาน</p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="space-y-1">
              <Label>ชื่อบิล</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น Netflix, ค่าไฟ" />
            </div>
            <div className="space-y-2">
              <Label>ไอคอน</Label>
              <IconPicker value={icon} onChange={setIcon} apps={[...paymentApps, ...billingApps, ...serviceApps]} />
            </div>
          </div>
        </div>

        {/* Section 2: กำหนดการชำระ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">กำหนดการชำระ</p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="space-y-2">
              <Label>วันครบกำหนด</Label>
              <DueDayPicker value={dueDay} onChange={setDueDay} />
            </div>
            <ReminderDaysPicker value={reminderDays} onChange={setReminderDays} />
          </div>
        </div>

        {/* Section 3: แอพที่เชื่อมต่อ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">แอพที่เชื่อมต่อ</p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <AppPicker apps={billingApps} selectedId={billingAppId} onChange={setBillingAppId} label="แอพดูยอด (ไม่บังคับ)" />
            <AppPicker apps={paymentApps} selectedId={paymentAppId} onChange={setPaymentAppId} required label="แอพจ่ายเงิน *" />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
    </div>
  );
}
