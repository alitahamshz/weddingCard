'use client';

import { motion } from 'framer-motion';
import { weddingConfig } from '@/lib/config';
import {
  CalendarIcon,
  ClockIcon,
  Divider,
  PinIcon,
} from '@/components/Ornament';

/** کارت‌های تاریخ، ساعت و مکان برگزاری */
export default function Details() {
  const items = [
    {
      Icon: CalendarIcon,
      title: 'تاریخ مراسم',
      lines: [weddingConfig.dateFa],
    },
    {
      Icon: ClockIcon,
      title: 'ساعت',
      lines: [weddingConfig.timeFa, weddingConfig.receptionFa],
    },
    {
      Icon: PinIcon,
      title: 'مکان',
      lines: [weddingConfig.venue, weddingConfig.address],
    },
  ];

  return (
    <section className="relative bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-3xl text-cocoa-900">جزئیات مراسم</h2>
        <Divider className="my-6" />

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl border border-gold/40 bg-cream/70 p-6 shadow-[0_16px_40px_-20px_rgba(150,90,100,0.4)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold shadow-md">
                <it.Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl text-cocoa-900">
                {it.title}
              </h3>
              {it.lines.map((l) => (
                <p key={l} className="mt-1 text-sm leading-7 text-stone-500">
                  {l}
                </p>
              ))}
            </motion.div>
          ))}
        </div>

        <a
          href={weddingConfig.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-cocoa-900 px-8 py-3 text-sm text-cream shadow-lg transition hover:bg-cocoa-800"
        >
          <PinIcon className="h-8 w-8" />
          مشاهده روی نقشه و مسیریابی
        </a>
      </div>
    </section>
  );
}
