'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ReceiptText } from 'lucide-react';
import { BillCard } from '@/presentation/components/BillCard';
import { Card, CardContent } from '@/components/ui/card';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

async function getToken(): Promise<string> {
  return liff.getAccessToken() ?? '';
}

function BillCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BillsPage() {
  const [templates, setTemplates] = useState<IBillTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    liff.getProfile().then((p) => {
      setDisplayName(p.displayName);
      setPictureUrl(p.pictureUrl ?? null);
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/bills', { headers: { 'x-liff-token': token } });
      if (res.ok) setTemplates(await res.json());
    } catch {
      setLoadError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('ลบบิลนี้?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE', headers: { 'x-liff-token': token } });
      if (res.ok) load();
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  }

  if (loadError) return <p className="p-4 text-red-500">{loadError}</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-blue-500/5 px-8 py-6">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-5 left-1/3 h-20 w-20 rounded-full bg-violet-500/10 blur-xl" />
        {/* <p className="relative text-xs text-muted-foreground mb-3">Bill Reminder</p> */}
        <div className="relative flex items-center gap-3">
          {displayName ? (
            <>
              {pictureUrl && (
                <Image src={pictureUrl} alt={displayName} width={48} height={48} className="rounded-full" />
              )}
              <div>
                <h1 className="text-2xl font-bold">สวัสดี, {displayName} <span className="animate-wave">👋</span></h1>
                <p className="text-sm text-muted-foreground">จัดการบิลและการแจ้งเตือนของคุณได้ที่นี่</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-6 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-56 rounded bg-muted animate-pulse" />
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <>
          <BillCardSkeleton />
          <BillCardSkeleton />
          <BillCardSkeleton />
        </>
      )}

      {!loading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <ReceiptText size={48} strokeWidth={1.5} />
          <p className="font-medium">ยังไม่มีบิล</p>
          <p className="text-sm">กดปุ่ม + ด้านล่างเพื่อเพิ่มบิลแรก</p>
        </div>
      )}

      {!loading && templates.map((t) => (
        <BillCard key={t.id} template={t} onDelete={handleDelete} />
      ))}

      <Link
        href="/liff/bills/new"
        aria-label="เพิ่มบิล"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
