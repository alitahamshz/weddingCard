'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { weddingConfig } from '@/lib/config';
import {
  buildGuestLink,
  buildGuestMessage,
  buildWhatsAppUrl,
  cleanSlug,
  normalizeGuest,
  slugify,
  toPublicGuests,
  type Guest,
} from '@/lib/guests';
import { toFaDigits } from '@/lib/utils';

const STORE_KEY = 'wedding-guests-v1';
const TEMPLATE_KEY = 'wedding-guests-template-v1';
const FALLBACK_ORIGIN = 'https://your-site.vercel.app';

type Draft = {
  slug: string;
  name: string;
  nameEn: string;
  seats: string;
  phone: string;
  side: string;
  note: string;
};

const EMPTY_DRAFT: Draft = {
  slug: '',
  name: '',
  nameEn: '',
  seats: '',
  phone: '',
  side: '',
  note: '',
};

type Notice = { kind: 'ok' | 'warn' | 'error'; text: string } | null;

/** پنل ساخت لینک اختصاصی مهمان‌ها */
export default function GuestAdmin({
  initialGuests,
}: {
  initialGuests: Guest[];
}) {
  const router = useRouter();
  const [list, setList] = useState<Guest[]>(initialGuests);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [origin, setOrigin] = useState('');
  const [template, setTemplate] = useState<string>(weddingConfig.guestMessage);
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const firstRender = useRef(true);

  /** کارهای ذخیره‌نشده پنل + آدرس سایت */
  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const storedList = localStorage.getItem(STORE_KEY);
      if (storedList) {
        const parsed: unknown = JSON.parse(storedList);
        if (Array.isArray(parsed)) {
          setList(
            parsed.map(normalizeGuest).filter((g): g is Guest => g !== null),
          );
        }
      }
      const storedTemplate = localStorage.getItem(TEMPLATE_KEY);
      if (storedTemplate) setTemplate(storedTemplate);
    } catch {
      /* حافظه در دسترس نیست */
    }
  }, []);

  /** ذخیره خودکار در مرورگر تا کارتان با رفرش از بین نرود */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
      localStorage.setItem(TEMPLATE_KEY, template);
    } catch {
      /* حافظه در دسترس نیست */
    }
  }, [list, template]);

  const linkOf = useCallback(
    (slug: string) => buildGuestLink(slug, origin || FALLBACK_ORIGIN),
    [origin],
  );

  const messageOf = useCallback(
    (guest: Guest) =>
      buildGuestMessage(template, {
        name: guest.name,
        link: linkOf(guest.slug),
        bride: weddingConfig.bride,
        groom: weddingConfig.groom,
      }),
    [linkOf, template],
  );

  const copy = useCallback(async (text: string, key: string) => {
    const mark = () => {
      setCopied(key);
      window.setTimeout(
        () => setCopied((current) => (current === key ? '' : current)),
        1800,
      );
    };
    try {
      await navigator.clipboard.writeText(text);
      mark();
      return;
    } catch {
      /* مرورگرهای قدیمی یا اتصال بدون HTTPS */
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      mark();
    } catch {
      setNotice({ kind: 'error', text: 'کپی نشد؛ متن را دستی انتخاب کنید.' });
    }
  }, []);

  const setField = (key: keyof Draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const publicJson = useMemo(
    () => JSON.stringify(toPublicGuests(list), null, 2),
    [list],
  );
  const backupJson = useMemo(
    () => JSON.stringify({ guests: list, template }, null, 2),
    [list, template],
  );
  const linksSheet = useMemo(
    () => list.map((g) => `${g.name}\t${linkOf(g.slug)}`).join('\n'),
    [list, linkOf],
  );

  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  /** ساخت مهمان جدید یا ذخیره ویرایش */
  const submitDraft = () => {
    const name = draft.name.trim();
    if (!name) {
      setNotice({ kind: 'error', text: 'نام مهمان را بنویسید.' });
      return;
    }
    const slug = cleanSlug(draft.slug.trim() || slugify(name));
    if (!slug) {
      setNotice({
        kind: 'error',
        text: 'لینک انگلیسی ساخته نشد؛ یک لینک کوتاه مثل pedram بنویسید.',
      });
      return;
    }
    if (list.some((g) => g.slug === slug && g.slug !== editing)) {
      setNotice({
        kind: 'error',
        text: 'این لینک قبلاً برای مهمان دیگری ساخته شده است.',
      });
      return;
    }

    const seats = Number(draft.seats.trim());
    const entry: Guest = {
      slug,
      name,
      nameEn: draft.nameEn.trim() || undefined,
      seats: Number.isFinite(seats) && seats > 0 ? Math.floor(seats) : undefined,
      phone: draft.phone.trim() || undefined,
      side: draft.side.trim() || undefined,
      note: draft.note.trim() || undefined,
    };

    setList((previous) =>
      editing
        ? previous.map((g) => (g.slug === editing ? entry : g))
        : [...previous, entry],
    );
    setNotice({
      kind: 'ok',
      text: editing
        ? `«${name}» ویرایش شد.`
        : `لینک «${name}» ساخته شد — همین حالا می‌توانید بفرستید.`,
    });
    setDraft(EMPTY_DRAFT);
    setEditing(null);
  };

  const startEdit = (guest: Guest) => {
    setEditing(guest.slug);
    setDraft({
      slug: guest.slug,
      name: guest.name,
      nameEn: guest.nameEn ?? '',
      seats: guest.seats ? String(guest.seats) : '',
      phone: guest.phone ?? '',
      side: guest.side ?? '',
      note: guest.note ?? '',
    });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeGuest = (guest: Guest) => {
    setList((previous) => previous.filter((g) => g.slug !== guest.slug));
    if (editing === guest.slug) {
      setEditing(null);
      setDraft(EMPTY_DRAFT);
    }
    setNotice({ kind: 'warn', text: `«${guest.name}» حذف شد.` });
  };

  /** نوشتن فهرست در فایل src/data/guests.json (فقط روی سیستم خودتان) */
  const saveToFile = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: toPublicGuests(list) }),
      });
      if (res.ok) {
        setNotice({
          kind: 'ok',
          text: 'فهرست مهمان‌ها در فایل src/data/guests.json ذخیره شد.',
        });
      } else if (res.status === 501) {
        setNotice({
          kind: 'warn',
          text: 'این سرور اجازهٔ نوشتن فایل ندارد (مثل Vercel). فایل guests.json را دانلود کنید، در src/data جایگزین کنید و دیپلوی کنید.',
        });
      } else if (res.status === 401) {
        setNotice({
          kind: 'error',
          text: 'ورود شما منقضی شده است؛ صفحه را دوباره باز کنید.',
        });
      } else {
        setNotice({ kind: 'error', text: 'ذخیره نشد؛ دوباره تلاش کنید.' });
      }
    } catch {
      setNotice({ kind: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setSaving(false);
    }
  };

  /** بارگذاری فهرست از متن JSON (پشتیبان یا خروجی قبلی) */
  const applyImport = () => {
    try {
      const parsed: unknown = JSON.parse(importText);
      const source = Array.isArray(parsed)
        ? parsed
        : (parsed as { guests?: unknown } | null)?.guests;
      if (!Array.isArray(source)) throw new Error('bad-json');
      const next = source
        .map(normalizeGuest)
        .filter((g): g is Guest => g !== null);
      setList(next);
      const rawTemplate = (parsed as { template?: unknown } | null)?.template;
      if (typeof rawTemplate === 'string' && rawTemplate.trim()) {
        setTemplate(rawTemplate);
      }
      setImportText('');
      setShowImport(false);
      setNotice({
        kind: 'ok',
        text: `${toFaDigits(next.length)} مهمان بارگذاری شد.`,
      });
    } catch {
      setNotice({ kind: 'error', text: 'متن JSON معتبر نبود.' });
    }
  };

  const reloadFromFile = () => {
    setList(initialGuests);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setNotice({ kind: 'ok', text: 'فهرست از فایل پروژه بازخوانی شد.' });
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    router.refresh();
  };

  const btnOutline =
    'rounded-xl border border-cocoa-700/20 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-gold/60';
  const btnGold =
    'rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-3 py-2 text-xs font-medium text-white shadow shadow-gold/30 transition-all duration-300 hover:bg-right';
  const noticeStyles: Record<'ok' | 'warn' | 'error', string> = {
    ok: 'bg-[#F1FBF3] text-[#276B3C] ring-[#9AD3AE]',
    warn: 'bg-[#FBF3DF] text-[#7A5F16] ring-gold/50',
    error: 'bg-[#FDF1F1] text-[#9B2C2C] ring-[#E5A4A4]',
  };

  return (
    <div className="space-y-5">
      {/* سربرگ */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-white/85 px-5 py-4 shadow-[0_16px_40px_-24px_rgba(138,109,27,0.5)]">
        <div>
          <h1 className="font-display text-xl text-cocoa-900">
            پنل مدیریت مهمان‌ها
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {toFaDigits(list.length)} مهمان — لینک اختصاصی هر کدام را بسازید و
            بفرستید
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className={btnOutline}>
            دیدن کارت دعوت
          </a>
          <button type="button" onClick={logout} className={btnOutline}>
            خروج
          </button>
        </div>
      </header>

      {notice && (
        <p
          className={`rounded-xl px-4 py-3 text-sm leading-6 ring-1 ${noticeStyles[notice.kind]}`}
        >
          {notice.text}
        </p>
      )}

      {/* فرم ساخت و ویرایش مهمان */}
      <section className="rounded-2xl border border-gold/40 bg-white/85 p-5 shadow-[0_16px_40px_-24px_rgba(138,109,27,0.5)]">
        <h2 className="font-display text-lg text-cocoa-900">
          {editing ? `ویرایش «${draft.name}»` : 'افزودن مهمان تازه'}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field
            label="نام مهمان (روی پاکت و کارت چاپ می‌شود)"
            value={draft.name}
            onChange={(value) => setField('name', value)}
            placeholder="پدرام"
            hint="مثلاً: پدرام، خانوادهٔ رضایی، جناب آقای احمدی"
          />
          <div>
            <Field
              label="لینک اختصاصی (انگلیسی و کوتاه)"
              value={draft.slug}
              onChange={(value) => setField('slug', value)}
              placeholder="pedram"
              ltr
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                خالی بگذارید تا خودکار ساخته شود
              </span>
              <button
                type="button"
                onClick={() => setField('slug', slugify(draft.name))}
                className="rounded-lg border border-cocoa-700/20 bg-white px-2 py-1 text-[11px] text-slate-600 transition hover:border-gold/60"
              >
                ساخت خودکار
              </button>
            </div>
          </div>
          <Field
            label="نام لاتین (اختیاری — برای فونت دست‌نویس روی پاکت)"
            value={draft.nameEn}
            onChange={(value) => setField('nameEn', value)}
            placeholder="Pedram"
            ltr
          />
          <Field
            label="ظرفیت (اختیاری — خودش + همراهان)"
            value={draft.seats}
            onChange={(value) => setField('seats', value)}
            placeholder="2"
            ltr
          />
          <Field
            label="شماره موبایل (اختیاری — برای دکمهٔ واتساپ)"
            value={draft.phone}
            onChange={(value) => setField('phone', value)}
            placeholder="09123456789"
            ltr
            hint="در فایل سایت ذخیره نمی‌شود؛ فقط در همین مرورگر می‌ماند"
          />
          <Field
            label="دسته‌بندی (اختیاری)"
            value={draft.side}
            onChange={(value) => setField('side', value)}
            placeholder="عروس / داماد / دوستان"
          />
          <div className="sm:col-span-2">
            <Field
              label="یادداشت خصوصی (اختیاری — در کارت دیده نمی‌شود)"
              value={draft.note}
              onChange={(value) => setField('note', value)}
              placeholder="همراه با همسر و دو فرزند"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={submitDraft}
            className="rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-gold/30 transition-all duration-300 hover:bg-right"
          >
            {editing ? 'ذخیرهٔ تغییرات' : 'ساخت لینک مهمان'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDraft(EMPTY_DRAFT);
              }}
              className="rounded-xl border border-cocoa-700/20 bg-white px-5 py-2.5 text-sm text-slate-600 transition hover:border-gold/60"
            >
              انصراف
            </button>
          )}
        </div>
      </section>
      {/* فهرست مهمان‌ها */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg text-cocoa-900">
            مهمان‌ها ({toFaDigits(list.length)})
          </h2>
          <span className="text-[11px] text-slate-400">
            تغییرات همین‌جا در مرورگر ذخیره می‌شود
          </span>
        </div>

        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gold/50 bg-white/60 px-5 py-8 text-center text-sm text-slate-500">
            هنوز مهمانی ساخته نشده است؛ از فرم بالا شروع کنید.
          </p>
        )}

        {list.map((guest) => (
          <article
            key={guest.slug}
            className="rounded-2xl border border-gold/30 bg-white/85 p-4 shadow-[0_12px_32px_-24px_rgba(138,109,27,0.6)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-display text-base text-cocoa-900">
                  {guest.name}
                  {guest.side ? (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold-dark">
                      {guest.side}
                    </span>
                  ) : null}
                  {guest.seats ? (
                    <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] text-cocoa-700">
                      ظرفیت {toFaDigits(guest.seats)} نفر
                    </span>
                  ) : null}
                </p>
                <p
                  dir="ltr"
                  className="mt-1 break-all text-left font-mono text-[11px] text-slate-500"
                >
                  {linkOf(guest.slug)}
                </p>
                {guest.note ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    یادداشت: {guest.note}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copy(linkOf(guest.slug), `link-${guest.slug}`)}
                  className={copied === `link-${guest.slug}` ? btnGold : btnOutline}
                >
                  {copied === `link-${guest.slug}` ? 'کپی شد ✓' : 'کپی لینک'}
                </button>
                <a
                  href={buildWhatsAppUrl(guest.phone ?? '', messageOf(guest))}
                  target="_blank"
                  rel="noreferrer"
                  className={btnOutline}
                  title={
                    guest.phone
                      ? 'باز کردن واتساپ همین شماره با متن آماده'
                      : 'واتساپ باز می‌شود تا مخاطب را انتخاب کنید'
                  }
                >
                  واتساپ
                </a>
                <button
                  type="button"
                  onClick={() => copy(messageOf(guest), `msg-${guest.slug}`)}
                  className={copied === `msg-${guest.slug}` ? btnGold : btnOutline}
                >
                  {copied === `msg-${guest.slug}` ? 'کپی شد ✓' : 'کپی متن پیام'}
                </button>
                <a
                  href={linkOf(guest.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className={btnOutline}
                >
                  پیش‌نمایش
                </a>
                <button
                  type="button"
                  onClick={() => startEdit(guest)}
                  className={btnOutline}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => removeGuest(guest)}
                  className="rounded-xl border border-[#E5A4A4] bg-white px-3 py-2 text-xs text-[#9B2C2C] transition hover:bg-[#FDF1F1]"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {/* قالب پیام ارسال */}
      <section className="rounded-2xl border border-gold/40 bg-white/85 p-5">
        <h2 className="font-display text-lg text-cocoa-900">متن پیام ارسال</h2>
        <p className="mt-1 text-[11px] leading-6 text-slate-400">
          متغیرها: {'{name}'} نام مهمان، {'{link}'} لینک کارت، {'{bride}'} و{' '}
          {'{groom}'} نام عروس و داماد
        </p>
        <textarea
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          rows={6}
          className="mt-3 w-full rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy(template, 'template')}
            className={copied === 'template' ? btnGold : btnOutline}
          >
            {copied === 'template' ? 'کپی شد ✓' : 'کپی متن قالب'}
          </button>
          <button
            type="button"
            onClick={() => setTemplate(weddingConfig.guestMessage)}
            className={btnOutline}
          >
            بازگردانی متن پیش‌فرض
          </button>
        </div>
      </section>
      {/* انتشار روی سایت */}
      <section className="rounded-2xl border border-gold/40 bg-white/85 p-5">
        <h2 className="font-display text-lg text-cocoa-900">انتشار روی سایت</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-xs leading-6 text-slate-600">
          <li>
            روی سیستم خودتان «ذخیره در فایل پروژه» را بزنید تا فایل{' '}
            <bdi>src/data/guests.json</bdi> به‌روز شود.
          </li>
          <li>
            اگر سایت روی هاست است، «دانلود guests.json» را بزنید و همین فایل را
            در <bdi>src/data</bdi> جایگزین کنید.
          </li>
          <li>
            تغییرات را commit و push کنید تا سایت دوباره ساخته شود؛ از آن لحظه
            لینک همهٔ مهمان‌ها فعال است.
          </li>
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveToFile}
            disabled={saving}
            className="rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-gold/30 transition-all duration-300 hover:bg-right disabled:opacity-60"
          >
            {saving ? 'در حال ذخیره…' : 'ذخیره در فایل پروژه'}
          </button>
          <button
            type="button"
            onClick={() => download(publicJson, 'guests.json')}
            className={btnOutline}
          >
            دانلود guests.json
          </button>
          <button
            type="button"
            onClick={() => copy(publicJson, 'json')}
            className={copied === 'json' ? btnGold : btnOutline}
          >
            {copied === 'json' ? 'کپی شد ✓' : 'کپی JSON سایت'}
          </button>
          <button
            type="button"
            onClick={() => download(backupJson, 'guests-backup.json')}
            className={btnOutline}
          >
            پشتیبان کامل (با شماره‌ها)
          </button>
          <button
            type="button"
            onClick={() => copy(linksSheet, 'links')}
            className={copied === 'links' ? btnGold : btnOutline}
          >
            {copied === 'links' ? 'کپی شد ✓' : 'کپی نام و لینک همه (Excel)'}
          </button>
          <button
            type="button"
            onClick={() => setShowImport((current) => !current)}
            className={btnOutline}
          >
            {showImport ? 'بستن بارگذاری' : 'بارگذاری JSON'}
          </button>
          <button type="button" onClick={reloadFromFile} className={btnOutline}>
            بازخوانی از فایل پروژه
          </button>
        </div>

        {showImport && (
          <div className="mt-4">
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={6}
              dir="ltr"
              placeholder="محتوای guests.json یا فایل پشتیبان را اینجا بچسبانید…"
              className="w-full rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-left font-mono text-[11px] leading-6 text-slate-700 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
            <button type="button" onClick={applyImport} className={`${btnGold} mt-2`}>
              بارگذاری
            </button>
          </div>
        )}

        <p className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-[11px] leading-6 text-cocoa-700">
          نکته: شمارهٔ موبایل و یادداشت خصوصی هیچ‌وقت داخل فایل سایت نمی‌رود؛
          فقط نام، لینک و ظرفیت در فایل ذخیره می‌شود (چون فایل سایت برای همه
          قابل دیدن است).
        </p>
      </section>
    </div>
  );
}

/** ورودی سادهٔ فرم پنل */
function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  ltr = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  ltr?: boolean;
}) {
  return (
    <label className="block text-right">
      <span className="mb-1.5 block text-xs font-medium text-cocoa-900">
        {label}
      </span>
      <input
        type="text"
        dir={ltr ? 'ltr' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-cocoa-700/20 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gold focus:ring-2 focus:ring-gold/30 ${
          ltr ? 'text-left' : ''
        }`}
      />
      {hint ? (
        <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}





