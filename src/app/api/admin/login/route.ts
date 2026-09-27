import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminToken,
  checkPassword,
  isAdminConfigured,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';

/** ورود به پنل مدیریت مهمان‌ها */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'not-configured' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: unknown }
    | null;
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!checkPassword(password)) {
    return NextResponse.json(
      { ok: false, error: 'invalid-password' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: adminToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
