import type { Metadata } from 'next';
import InvitationPage from '@/components/InvitationPage';
import { findGuestBySlug } from '@/lib/guests-store';
import { weddingConfig } from '@/lib/config';

type PageProps = {
  searchParams: Promise<{ guest?: string | string[] }>;
};

/** اولین مقدار (در صورت تکرار پارامتر) را برمی‌گرداند */
async function readSlug(searchParams: PageProps['searchParams']) {
  const { guest } = await searchParams;
  return Array.isArray(guest) ? guest[0] : guest;
}

const baseTitle = `جشن عروسی ${weddingConfig.bride} و ${weddingConfig.groom}`;

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const guest = await findGuestBySlug(await readSlug(searchParams));
  if (!guest) {
    return {
      title: baseTitle,
      description: `با کمال مسرت شما را به جشن عروسی ${weddingConfig.bride} و ${weddingConfig.groom} دعوت می‌کنیم — ${weddingConfig.dateFa}`,
    };
  }
  // لینک‌های اختصاصی مهمان‌ها در گوگل ایندکس نشوند
  return {
    title: `دعوت‌نامهٔ ویژهٔ ${guest.name} | ${baseTitle}`,
    description: `دعوت‌نامهٔ اختصاصی ${guest.name} برای جشن عروسی ${weddingConfig.bride} و ${weddingConfig.groom} — ${weddingConfig.dateFa}`,
    robots: { index: false, follow: false },
  };
}

/**
 * آدرس کارت:  /?guest=pedram  (بدون پارامتر = نسخه عمومی)
 * کارت هر مهمان سمت سرور ساخته می‌شود تا نام او بدون پرش و فلش، همراه
 * همان HTML اولیه بیاید.
 */
export default async function Page({ searchParams }: PageProps) {
  const guest = await findGuestBySlug(await readSlug(searchParams));
  return <InvitationPage guest={guest} />;
}

