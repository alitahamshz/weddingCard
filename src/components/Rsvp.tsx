'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toFaDigits } from '@/lib/utils';
import { Divider } from '@/components/Ornament';

type Entry = {
  name: string;
  guests: number;
  attending: 'yes' | 'no';
  message: string;
  at: number;
};

const KEY = 'wedding-rsvp-entries-v1';

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

/** فرم اعلام حضور مهمانان (ذخیره‌سازی نمایشی در مرورگر) */
export default function Rsvp() {
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(0);
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    const entries = loadEntries();
    setConfirmedCount(
      entries
        .filter((e) => e.attending === 'yes')
        .reduce((s, e) => s + 1 + e.guests, 0),
    );
  }, []);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (name.trim().length < 2) {
      setError('لطفاً نام و نام خانوادگی خود را بنویسید.');
      return;
    }
    setError('');
    const entries = loadEntries();
    entries.push({
      name: name.trim(),
      guests,
      attending,
      message: message.trim(),
      at: Date.now(),
    });
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      /* حافظه در دسترس نیست */
    }
    if (attending === 'yes') setConfirmedCount((c) => c + 1 + guests);
    setDone(true);
  };

  const reset = () => {
    setName('');
    setGuests(0);
    setAttending('yes');
    setMessage('');
    setError('');
    setDone(false);
  };

  const guestOptions = [
    'فقط خودم',
    '۱ همراه',
    '۲ همراه',
    '۳ همراه',
    '۴ همراه',
  ];

  return (
    <section
      id="rsvp"
      className="relative scroll-mt-4 bg-gradient-to-b from-white via-cream to-cream px-4 py-20 sm:py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-xl rounded-2xl border border-gold/50 bg-white/80 p-8 text-center shadow-[0_24px_70px_-24px_rgba(138,109,27,0.45)] backdrop-blur-sm sm:p-10"
      >
        <h2 className="font-display text-3xl text-cocoa-900">اعلام حضور</h2>
        <Divider className="my-5" />
        <p className="text-sm leading-7 text-slate-500">
          خوشحال می‌شویم بدانیم در این شب به‌یادماندنی همراهمان هستید یا نه
        </p>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="mt-8"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 ring-2 ring-gold/50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-gold-dark"
                aria-hidden
              >
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </div>
            <p className="mt-4 font-display text-2xl text-cocoa-900">
              {name.trim()} عزیز، ممنون!
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              {attending === 'yes'
                ? 'حضورتان ثبت شد؛ بی‌صبرانه منتظر دیدارتان هستیم.'
                : 'پاسختان ثبت شد؛ جایتان در قلبمان سبز خواهد بود.'}
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-full border border-cocoa-700/30 px-6 py-2 text-sm text-cocoa-800 transition hover:bg-cocoa-900 hover:text-cream"
            >
              ثبت پاسخ دیگر
            </button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5 text-right">
            <div>
              <label
                htmlFor="rsvp-name"
                className="mb-2 block text-sm font-medium text-cocoa-900"
              >
                نام و نام خانوادگی
              </label>
              <input
                id="rsvp-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً سارا محمدی"
                className="w-full rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-cocoa-900">
                آیا در مراسم حضور دارید؟
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttending('yes')}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    attending === 'yes'
                      ? 'border-gold bg-gold/15 font-medium text-cocoa-900 ring-2 ring-gold/40'
                      : 'border-cocoa-700/20 bg-white text-slate-500 hover:border-gold/60'
                  }`}
                >
                  حتماً می‌آیم
                </button>
                <button
                  type="button"
                  onClick={() => setAttending('no')}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    attending === 'no'
                      ? 'border-gold bg-gold/15 font-medium text-cocoa-900 ring-2 ring-gold/40'
                      : 'border-cocoa-700/20 bg-white text-slate-500 hover:border-gold/60'
                  }`}
                >
                  متأسفانه نمی‌توانم
                </button>
              </div>
            </div>

            {attending === 'yes' && (
              <div>
                <label
                  htmlFor="rsvp-guests"
                  className="mb-2 block text-sm font-medium text-cocoa-900"
                >
                  تعداد همراهان
                </label>
                <select
                  id="rsvp-guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                >
                  {guestOptions.map((label, i) => (
                    <option key={label} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="rsvp-message"
                className="mb-2 block text-sm font-medium text-cocoa-900"
              >
                پیام برای عروس و داماد <span className="font-normal text-slate-400">(اختیاری)</span>
              </label>
              <textarea
                id="rsvp-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="آرزوی خوشبختی..."
                rows={3}
                className="w-full resize-none rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5F16] ring-1 ring-gold/40">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-6 py-3.5 font-medium text-white shadow-lg shadow-gold/30 transition-all duration-300 hover:bg-right hover:shadow-xl"
            >
              ثبت پاسخ
            </button>
          </form>
        )}

        {confirmedCount > 0 && (
          <p className="mt-6 text-xs text-slate-400">
            تاکنون {toFaDigits(confirmedCount)} نفر حضورشان را تأیید کرده‌اند
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          نسخه نمایشی: پاسخ‌ها فقط در همین مرورگر ذخیره می‌شود
        </p>
      </motion.div>
    </section>
  );
}
