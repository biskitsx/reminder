'use client';
import { useEffect, useMemo, useState } from 'react';
import liff from '@line/liff';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InstanceStatusBadge } from '@/presentation/components/InstanceStatusBadge';
import { IBillInstance } from '@/domain/entities/BillInstance';

const BANGKOK_TZ = 'Asia/Bangkok';
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

async function getToken() { return liff.getAccessToken() ?? ''; }

function rowTint(instance: IBillInstance, now: Date): string {
  if (instance.isPaid) return 'bg-green-50';
  const dueDate = new Date(instance.year, instance.month - 1, instance.dueDay);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((dueDate.getTime() - todayDate.getTime()) / msPerDay);
  if (daysLeft < 0) return 'bg-red-50';
  if (daysLeft <= 3) return 'bg-amber-50';
  return '';
}

export default function HistoryPage() {
  const now = useMemo(() => toZonedTime(new Date(), BANGKOK_TZ), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [instances, setInstances] = useState<IBillInstance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`/api/bills/instances?month=${month}&year=${year}`, {
          headers: { 'x-liff-token': token },
        });
        if (res.ok) setInstances(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
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

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">ประวัติการจ่าย</h1>

      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors"
          aria-label="เดือนก่อน"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold">{THAI_MONTHS[month - 1]} {year + 543}</span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && instances.length === 0 && (
        <p className="text-center text-muted-foreground py-8">ไม่มีบิลในเดือนนี้</p>
      )}

      {!loading && (
        <div className="space-y-2">
          {instances.map((inst) => (
            <Card key={inst.id} className={rowTint(inst, now)}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{inst.name}</p>
                  <p className="text-sm text-muted-foreground">ครบกำหนด {inst.dueDay} {THAI_MONTHS[inst.month - 1]}</p>
                </div>
                <InstanceStatusBadge instance={inst} now={now} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
