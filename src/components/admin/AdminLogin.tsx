'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Divider } from '@/components/Ornament';

/** فرم ورود به پنل مدیریت مهمان‌ها */
export default function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        setError(
          data?.error === 'not-configured'
            ? 'رمز مدیریت تنظیم نشده است.'
            : 'رمز اشتباه است.',
        );
        return;
      }
      setPassword('');
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-gold/50 bg-white/85 p-8 text-center shadow-[0_24px_70px_-24px_rgba(138,109,27,0.4)] backdrop-blur-sm sm:p-10">
      <h1 className="font-display text-2xl text-cocoa-900">پنل مدیریت مهمان‌ها</h1>
      <Divider className="my-5" />
      <p className="text-sm leading-7 text-stone-500">
        برای ساخت لینک اختصاصی هر مهمان، رمز مدیریت را وارد کنید
      </p>

      {!configured && (
        <p className="mt-5 rounded-xl bg-[#FBF3DF] px-4 py-3 text-xs leading-6 text-[#7A5F16] ring-1 ring-gold/40">
          رمز مدیریت تعریف نشده است. یک فایل <bdi>.env.local</bdi> در ریشه پروژه
          بسازید و خط <bdi>ADMIN_PASSWORD=رمز-دلخواه</bdi> را در آن بنویسید
          (روی Vercel در Settings → Environment Variables).
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4 text-right">
        <div>
          <label
            htmlFor="admin-password"
            className="mb-2 block text-sm font-medium text-cocoa-900"
          >
            رمز مدیریت
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-cocoa-700/20 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5F16] ring-1 ring-gold/40">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-dark bg-[length:200%_auto] px-6 py-3.5 font-medium text-white shadow-lg shadow-gold/30 transition-all duration-300 hover:bg-right hover:shadow-xl disabled:opacity-60"
        >
          {busy ? 'در حال بررسی…' : 'ورود'}
        </button>
      </form>
    </section>
  );
}
