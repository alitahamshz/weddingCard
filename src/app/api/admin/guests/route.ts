import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { normalizeGuest, toPublicGuest, type Guest } from '@/lib/guests';
import { getAllGuests, saveGuests, isDbConfigured } from '@/lib/guests-store';

export const runtime = 'nodejs';

/** دریافت فهرست فعلی مهمان‌ها از دیتابیس یا فایل */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const list = await getAllGuests();
  return NextResponse.json({
    ok: true,
    guests: list,
    dbConfigured: isDbConfigured(),
  });
}

/** ذخیرهٔ فهرست مهمان‌ها در دیتابیس یا فایل */
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
    const result = await saveGuests(list);
    return NextResponse.json({
      ok: true,
      count: list.length,
      destination: result.destination,
    });
  } catch (err) {
    console.error('Error saving guests:', err);
    return NextResponse.json({ ok: false, error: 'read-only' }, { status: 501 });
  }
}

