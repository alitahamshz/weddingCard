import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { normalizeGuest, toPublicGuest, type Guest } from '@/lib/guests';

export const runtime = 'nodejs';

const FILE = path.join(process.cwd(), 'src', 'data', 'guests.json');

/**
 * نوشتن فهرست مهمان‌ها در فایل src/data/guests.json.
 * این کار فقط وقتی ممکن است که پروژه روی سیستم خودتان اجرا شود؛
 * روی هاست‌های serverless (مثل Vercel) فایل قابل نوشتن نیست و در آن صورت
 * کد 501 برمی‌گردد تا پنل، راه دانلود فایل را نشان دهد.
 */
export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { guests?: unknown }
    | null;
  if (!body || !Array.isArray(body.guests)) {
    return NextResponse.json({ ok: false, error: 'invalid-body' }, { status: 400 });
  }

  const list = body.guests
    .map(normalizeGuest)
    .filter((g): g is Guest => g !== null)
    .map(toPublicGuest);

  try {
    await fs.writeFile(FILE, `${JSON.stringify(list, null, 2)}\n`, 'utf8');
  } catch {
    return NextResponse.json({ ok: false, error: 'read-only' }, { status: 501 });
  }

  return NextResponse.json({ ok: true, count: list.length });
}
