'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import liff from '@line/liff';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppPicker } from '@/presentation/components/AppPicker';
import { ReminderDaysPicker } from '@/presentation/components/ReminderDaysPicker';
import { DueDayPicker } from '@/presentation/components/DueDayPicker';
import { IconPicker } from '@/presentation/components/IconPicker';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { IExternalApp } from '@/domain/entities/ExternalApp';

async function getToken() { return liff.getAccessToken() ?? ''; }

export default function EditBillPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [dueDay, setDueDay] = useState(1);
  const [paymentAppId, setPaymentAppId] = useState<string | null>(null);
  const [billingAppId, setBillingAppId] = useState<string | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([3, 1]);
  const [paymentApps, setPaymentApps] = useState<IExternalApp[]>([]);
  const [billingApps, setBillingApps] = useState<IExternalApp[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
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
          setIcon(template.icon ?? null);
          setDueDay(template.dueDay);
          setPaymentAppId(template.paymentAppId);
          setBillingAppId(template.billingAppId);
          setReminderDays(template.reminderDays);
        }
        setPaymentApps(Array.isArray(pa) ? pa : []);
        setBillingApps(Array.isArray(ba) ? ba : []);
      } catch {
        alert('โหลดข้อมูลไม่สำเร็จ');
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentAppId) return alert('กรุณาเลือกแอพจ่ายเงิน');
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PATCH',
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
        <h1 className="text-xl font-bold">แก้ไขบิล</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>ชื่อบิล</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>ไอคอน</Label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <div className="space-y-2">
          <Label>วันครบกำหนด</Label>
          <DueDayPicker value={dueDay} onChange={setDueDay} />
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
