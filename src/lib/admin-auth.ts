import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/** نام کوکی ورود پنل مدیریت */
export const ADMIN_COOKIE = 'wedding_admin';
/** مدت اعتبار ورود: یک هفته */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** آیا رمز مدیریت در متغیرهای محیطی تعریف شده است؟ (ADMIN_PASSWORD) */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** مقدار کوکی از روی رمز ساخته می‌شود؛ خود رمز هرگز در مرورگر ذخیره نمی‌شود */
export function adminToken(): string {
  return createHash('sha256')
    .update(`wedding-card::${process.env.ADMIN_PASSWORD ?? ''}`)
    .digest('hex');
}

/** مقایسه امن رمز ورودی با رمز تنظیم‌شده */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !input) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** آیا بازدیدکننده وارد پنل شده است؟ */
export async function isAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}
