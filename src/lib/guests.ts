/**
 * مهمان‌ها و لینک اختصاصی هر کارت
 * ------------------------------------------------------------------
 * فهرست مهمان‌ها در «src/data/guests.json» نگه داشته می‌شود و پنل «/admin»
 * آن را برایتان می‌سازد. هر مهمان با آدرس «/?guest=<slug>» کارت اختصاصی
 * خودش را می‌بیند (مثلاً /?guest=pedram).
 */
import rawGuests from '@/data/guests.json';

export type Guest = {
  /** بخش یکتای لینک کارت (فقط حروف کوچک انگلیسی، عدد، - و _) */
  slug: string;
  /** نامی که روی پاکت و کارت نمایش داده می‌شود */
  name: string;
  /** نام لاتین (اختیاری) برای فونت دست‌نویس روی پاکت */
  nameEn?: string;
  /** ظرفیت: خودش + همراهان */
  seats?: number;
  /** شماره موبایل برای ارسال سریع در واتساپ */
  phone?: string;
  /** دسته‌بندی دلخواه (عروس، داماد، دوستان…) — فقط در پنل مدیریت */
  side?: string;
  /** یادداشت خصوصی (در کارت مهمان دیده نمی‌شود) */
  note?: string;
};

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

/** تبدیل ورودی خام فایل JSON به مهمان سالم؛ ردیف‌های ناقص نادیده گرفته می‌شوند */
export function normalizeGuest(value: unknown): Guest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const name = text(raw.name);
  if (!name) return null;
  const slug = cleanSlug(text(raw.slug) ?? slugify(name));
  if (!slug) return null;

  const seatsRaw =
    typeof raw.seats === 'number' ? raw.seats : Number(text(raw.seats) ?? '');
  const seats =
    Number.isFinite(seatsRaw) && seatsRaw > 0 ? Math.floor(seatsRaw) : undefined;

  return {
    slug,
    name,
    nameEn: text(raw.nameEn),
    seats,
    phone: text(raw.phone),
    side: text(raw.side),
    note: text(raw.note),
  };
}

/** پاک‌سازی لینک: فاصله→خط تیره و حذف نویسه‌های غیرمجاز */
export function cleanSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** نگاشت حروف فارسی/عربی و ارقام به معادل لاتین (برای پیشنهاد لینک) */
const FA_TO_LATIN: Record<string, string> = {
  آ: 'a', ا: 'a', أ: 'a', إ: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's',
  ج: 'j', چ: 'ch', ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z',
  ژ: 'zh', س: 's', ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: 'a',
  غ: 'gh', ف: 'f', ق: 'gh', ک: 'k', ك: 'k', گ: 'g', ل: 'l', م: 'm',
  ن: 'n', و: 'v', ؤ: 'o', ه: 'h', ة: 'h', ی: 'y', ي: 'y', ئ: 'y', ء: '',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '\u200c': '', '-': '-', _: '_',
};

/**
 * ساخت لینک انگلیسی از نام مهمان («پدرام» → pdram، «علی احمدی» → ali-ahmadi).
 * حروف صدادار کوتاه فارسی نوشته نمی‌شوند، پس نتیجه همیشه زیبا نیست؛
 * در پنل مدیریت می‌توانید لینک را دستی اصلاح کنید.
 */
export function slugify(name: string): string {
  const out = Array.from(name)
    .map((ch) => {
      if (/[A-Za-z0-9\-_]/.test(ch)) return ch;
      if (ch === ' ') return '-';
      return FA_TO_LATIN[ch] ?? '';
    })
    .join('');
  return cleanSlug(out);
}

/** فهرست مهمان‌های فعال (از فایل src/data/guests.json) */
export const guests: Guest[] = Array.isArray(rawGuests)
  ? (rawGuests as unknown[])
      .map(normalizeGuest)
      .filter((g): g is Guest => g !== null)
  : [];

/** پیدا کردن مهمان با لینک اختصاصی */
export function getGuest(slug?: string | null): Guest | null {
  if (!slug) return null;
  const key = cleanSlug(slug);
  if (!key) return null;
  return guests.find((g) => g.slug === key) ?? null;
}

/** لینک کارت اختصاصی مهمان */
export function buildGuestLink(slug: string, origin: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/?guest=${encodeURIComponent(slug)}`;
}

/**
 * فقط فیلدهای عمومی مهمان — همین‌ها در فایل سایت می‌نشینند.
 * شمارهٔ موبایل و یادداشت خصوصی هرگز وارد فایل نمی‌شوند، چون فایل سایت
 * همراه بستهٔ جاوااسکریپت برای همه قابل دیدن است.
 */
export function toPublicGuest(guest: Guest) {
  return {
    slug: guest.slug,
    name: guest.name,
    ...(guest.nameEn ? { nameEn: guest.nameEn } : {}),
    ...(guest.seats ? { seats: guest.seats } : {}),
    ...(guest.side ? { side: guest.side } : {}),
  };
}

export function toPublicGuests(list: Guest[]) {
  return list.map(toPublicGuest);
}

/** پر کردن قالب پیام با مقادیر {name}، {link}، {bride}، {groom} */
export function buildGuestMessage(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

/** آماده‌سازی شماره برای واتساپ: ۰۹۱۲… → 98912… */
export function waPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0098')) return digits.slice(2);
  if (digits.startsWith('98')) return digits;
  if (digits.startsWith('0')) return `98${digits.slice(1)}`;
  return digits;
}

/** لینک باز کردن واتساپ با متن آماده (بدون شماره، فهرست گفتگوها باز می‌شود) */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const to = waPhone(phone);
  const text = encodeURIComponent(message);
  return to ? `https://wa.me/${to}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** نام تمام‌لاتین؟ (برای استفاده از فونت دست‌نویس روی پاکت) */
export function isLatinName(name: string): boolean {
  return /^[\x20-\x7E]+$/.test(name);
}
