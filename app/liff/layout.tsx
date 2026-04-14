'use client';
import { useEffect, useState } from 'react';
import liff from '@line/liff';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, Clock, Loader2 } from 'lucide-react';

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(async () => {
        if (!liff.isInClient() && !liff.isLoggedIn()) {
          try {
            liff.login();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
          }
          return;
        }
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!ready) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-muted-foreground" />
    </div>
  );

  const navItems = [
    { href: '/liff/bills', label: 'บิล', icon: Receipt, match: (p: string) => p.startsWith('/liff/bills') },
    { href: '/liff/history', label: 'ประวัติ', icon: Clock, match: (p: string) => p === '/liff/history' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background flex">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                active ? 'text-foreground border-t-2 border-t-primary -mt-px' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
