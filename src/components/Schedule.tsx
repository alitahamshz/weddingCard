'use client';

import { motion } from 'framer-motion';
import { weddingConfig } from '@/lib/config';
import { Divider } from '@/components/Ornament';

/** خط زمانی برنامه شب عروسی */
export default function Schedule() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E2] to-cream px-4 py-20 sm:py-24">
      <div className="relative mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl text-cocoa-900">برنامه شب عروسی</h2>
        <Divider className="my-6" />

        <div className="relative mt-10 text-right">
          <div
            className="absolute bottom-2 right-[19px] top-2 w-px bg-gradient-to-b from-transparent via-gold/70 to-transparent"
            aria-hidden
          />
          <div className="space-y-6">
            {weddingConfig.schedule.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="relative flex gap-4"
              >
                <div className="relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center">
                  <span
                    className="absolute h-3.5 w-3.5 rotate-45 bg-gold shadow-[0_0_12px_rgba(201,162,39,0.8)]"
                    aria-hidden
                  />
                </div>
                <div className="flex-1 rounded-xl border border-gold/40 bg-white/80 p-4 shadow-[0_14px_34px_-18px_rgba(150,90,100,0.45)] backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg text-cocoa-900">
                      {s.title}
                    </h3>
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold-dark ring-1 ring-gold/50">
                      {s.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-7 text-stone-500">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
