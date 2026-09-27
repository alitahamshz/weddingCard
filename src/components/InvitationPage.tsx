'use client';

import Envelope from '@/components/Envelope';
import Invitation from '@/components/Invitation';
import Countdown from '@/components/Countdown';
import Details from '@/components/Details';
import Schedule from '@/components/Schedule';
import Rsvp from '@/components/Rsvp';
import Footer from '@/components/Footer';
import MusicPlayer from '@/components/MusicPlayer';
import { GuestProvider } from '@/components/GuestContext';
import type { Guest } from '@/lib/guests';

/**
 * کل صفحه دعوت‌نامه. اگر مهمان مشخص شده باشد، همه بخش‌ها نسخه اختصاصی
 * او را نشان می‌دهند (نام روی پاکت، کارت و فرم اعلام حضور).
 */
export default function InvitationPage({ guest = null }: { guest?: Guest | null }) {
  return (
    <GuestProvider guest={guest}>
      <main className="overflow-x-clip">
        <Envelope />
        <Invitation />
        <Countdown />
        <Details />
        <Schedule />
        <Rsvp />
        <Footer />
        <MusicPlayer />
      </main>
    </GuestProvider>
  );
}
