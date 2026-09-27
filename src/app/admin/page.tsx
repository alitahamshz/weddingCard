import type { Metadata } from 'next';
import AdminLogin from '@/components/admin/AdminLogin';
import GuestAdmin from '@/components/admin/GuestAdmin';
import { getAllGuests } from '@/lib/guests-store';
import { isAdmin, isAdminConfigured } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'پنل مدیریت مهمان‌ها',
  robots: { index: false, follow: false },
};

/** همیشه تازه بررسی شود که کاربر وارد شده است */
export const dynamic = 'force-dynamic';

/** پنل ساخت لینک اختصاصی مهمان‌ها (رمزدار) */
export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authed = await isAdmin();
  const currentGuests = authed ? await getAllGuests() : [];

  return (
    <main className="min-h-svh bg-gradient-to-b from-[#FFFDF8] via-cream to-[#FFFDF8] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        {authed ? (
          <GuestAdmin initialGuests={currentGuests} />
        ) : (
          <AdminLogin configured={configured} />
        )}
      </div>
    </main>
  );
}

