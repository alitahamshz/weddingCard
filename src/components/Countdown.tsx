'use client';

import { useEffect, useState } from 'react';
import { weddingConfig } from '@/lib/config';
import { toFaDigits } from '@/lib/utils';
import { Divider } from '@/components/Ornament';

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function getParts(target: number): Parts {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: diff <= 0,
  };
}

/** شمارش معکوس تا روز عروسی */
export default function Countdown() {
  const target = new Date(weddingConfig.dateISO).getTime();
  // مقدار اولیه صفر تا رندر سرور و کلاینت یکسان باشد (جلوگیری از خطای هایدریشن)
  const [t, setT] = useState<Parts>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: false,
  });

  useEffect(() => {
    setT(getParts(target));
    const id = setInterval(() => setT(getParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const items = [
    { v: t.days, l: 'روز' },
    { v: t.hours, l: 'ساعت' },
    { v: t.minutes, l: 'دقیقه' },
    { v: t.seconds, l: 'ثانیه' },
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#FFFDF8] via-[#F8F0DC] to-[#F3E7CC] px-4 py-20 text-center sm:py-24">
      <h2 className="font-display text-3xl text-cocoa-900">
        شمارش معکوس تا جشن پیوند
      </h2>
      <Divider className="my-6" />

      {t.done ? (
        <p className="font-display text-2xl leading-10 text-cocoa-800">
          این روز فرخنده فرا رسیده است
        </p>
      ) : (
        <div
          className="mx-auto flex max-w-xl items-stretch justify-center gap-3 sm:gap-4"
          dir="rtl"
        >
          {items.map((it) => (
            <div
              key={it.l}
              className="min-w-[68px] flex-1 rounded-xl border border-gold/50 bg-white/85 px-2 py-5 shadow-[0_14px_34px_-14px_rgba(138,109,27,0.4)] backdrop-blur-sm sm:min-w-[90px]"
            >
              <div className="text-gold-deep font-display text-4xl sm:text-5xl">
                {toFaDigits(it.v)}
              </div>
              <div className="mt-2 text-xs text-cocoa-600 sm:text-sm">{it.l}</div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-cocoa-700">
        {weddingConfig.dateFa} • {weddingConfig.timeFa}
      </p>
    </section>
  );
}
