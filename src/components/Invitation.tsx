'use client';

import { motion } from 'framer-motion';
import { weddingConfig } from '@/lib/config';
import { Corner, Divider, Heart } from '@/components/Ornament';
import Image from 'next/image';

/** کارت اصلی دعوت با قاب طلایی */
export default function Invitation() {
  return (
    <section className="relative bg-gradient-to-b from-[#FFFDF8] via-[#FAF3E3] to-[#FFFDF8] px-4 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative mx-auto max-w-2xl rounded-2xl border border-gold/50 bg-white/85 p-8 text-center shadow-[0_24px_70px_-24px_rgba(138,109,27,0.4)] backdrop-blur-sm sm:p-12"
      >
        <div
          className="pointer-events-none absolute inset-3 rounded-xl border border-gold/30"
          aria-hidden
        />
        <Corner className="absolute left-5 top-5 h-14 w-14 text-gold/80" />
        <Corner className="absolute right-5 top-5 h-14 w-14 -scale-x-100 text-gold/80" />
        <Corner className="absolute bottom-5 left-5 h-14 w-14 -scale-y-100 text-gold/80" />
        <Corner className="absolute bottom-5 right-5 h-14 w-14 -scale-100 text-gold/80" />

        <p className="font-display text-lg text-cocoa-700 sm:text-xl">
          به نام خداوند عشق و مهربانی
        </p>
        <Divider className="my-6" />

        <p className="mx-auto max-w-md text-[15px] leading-9 text-stone-500">
          دست در دست هم، با قلبی لبریز از عشق
          <br />
          فصل تازه‌ای از زندگی را آغاز می‌کنیم
        </p>

        <div className="my-8 flex items-center justify-center  gap-4 sm:gap-6">
          <span className="text-gold-deep p-1 font-display text-4xl leading-snug sm:text-5xl">
            {weddingConfig.bride}
          </span>
          {/* <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/40"> */}
            {/* <Heart className="h-5 w-5 text-gold-dark" /> */}
            <Image src={"/images/ring.png"} width={100} height={100} alt='RING'></Image>
          {/* </span> */}
          <span className="text-gold-deep font-display text-4xl sm:text-5xl">
            {weddingConfig.groom}
          </span>
        </div>

        <p className="mx-auto max-w-md text-[15px] leading-9 text-stone-500">
          به همراه خانواده‌هایمان، از شما دعوت می‌کنیم
          <br />
          تا در شادی ما سهیم باشید
        </p>

        <Divider className="my-6" />

        <p className="font-display text-xl text-cocoa-800">
          {weddingConfig.dateFa}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {weddingConfig.timeFa} • {weddingConfig.venue}
        </p>

        <a
          href="#rsvp"
          className="mt-8 inline-block rounded-full bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-10 py-3 font-medium text-white shadow-lg shadow-gold/30 transition-all duration-300 hover:bg-right hover:shadow-xl"
        >
          اعلام حضور
        </a>
      </motion.div>
    </section>
  );
}
