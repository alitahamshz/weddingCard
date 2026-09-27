'use client';

import { createContext, useContext } from 'react';
import type { Guest } from '@/lib/guests';

/**
 * مهمان فعلی صفحه؛ اگر آدرس بدون «?guest=…» باز شده باشد مقدارش null است
 * و همه‌چیز مثل حالت عمومی («دعوت‌نامه‌ای برای شما رسیده است») نمایش داده می‌شود.
 */
const GuestContext = createContext<Guest | null>(null);

export function GuestProvider({
  guest,
  children,
}: {
  guest: Guest | null;
  children: React.ReactNode;
}) {
  return <GuestContext.Provider value={guest}>{children}</GuestContext.Provider>;
}

/** خواندن مهمان فعلی از داخل هر کامپوننت کلاینتی */
export function useGuest(): Guest | null {
  return useContext(GuestContext);
}
