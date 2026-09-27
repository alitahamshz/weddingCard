import type { Metadata } from 'next';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/900.css';
import '@fontsource/oswald/200.css';
import '@fontsource/oswald/300.css';
import '@fontsource/oswald/400.css';
import '@fontsource/great-vibes/400.css';
import './globals.css';
import { weddingConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: `جشن عروسی ${weddingConfig.bride} و ${weddingConfig.groom}`,
  description: `با کمال مسرت شما را به جشن عروسی ${weddingConfig.bride} و ${weddingConfig.groom} دعوت می‌کنیم — ${weddingConfig.dateFa}`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-cream font-body text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
