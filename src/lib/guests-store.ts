import { Redis } from '@upstash/redis';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import rawGuests from '@/data/guests.json';
import { normalizeGuest, type Guest } from './guests';

const REDIS_KEY = 'wedding_guests_data';

function getRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.weddingdb_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.weddingdb_KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isDbConfigured(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.weddingdb_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.weddingdb_KV_REST_API_TOKEN;

  return Boolean(url && token);
}

/** دریافت تمام مهمان‌ها: اگر دیتابیس وصل باشد از دیتابیس، وگرنه از فایل guests.json */
export async function getAllGuests(): Promise<Guest[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<unknown[]>(REDIS_KEY);
      if (Array.isArray(data)) {
        return data.map(normalizeGuest).filter((g): g is Guest => g !== null);
      }
    } catch (e) {
      console.error('Failed to read from Redis, falling back to local file:', e);
    }
  }

  // در صورت عدم تنظیم دیتابیس یا خطا، از فایل محلی استفاده شود
  return Array.isArray(rawGuests)
    ? (rawGuests as unknown[])
        .map(normalizeGuest)
        .filter((g): g is Guest => g !== null)
    : [];
}

/** پیدا کردن یک مهمان بر اساس اسلاگ */
export async function findGuestBySlug(slug?: string | null): Promise<Guest | null> {
  if (!slug) return null;
  const list = await getAllGuests();
  const trimmed = slug.trim().toLowerCase();
  return list.find((g) => g.slug.toLowerCase() === trimmed) ?? null;
}

/** ذخیره مهمان‌ها در دیتابیس (اگر موجود باشد) یا در فایل لوکال */
export async function saveGuests(guests: Guest[]): Promise<{
  destination: 'database' | 'file';
}> {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(REDIS_KEY, guests);
    return { destination: 'database' };
  }

  // تلاش برای نوشتن در فایل محلی (مخصوص محیط توسعه)
  const filePath = path.join(process.cwd(), 'src', 'data', 'guests.json');
  await fs.writeFile(filePath, `${JSON.stringify(guests, null, 2)}\n`, 'utf8');
  return { destination: 'file' };
}
