import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import '@/app/globals.css';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Bill Reminder',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={notoSansThai.variable}>{children}</body>
    </html>
  );
}
