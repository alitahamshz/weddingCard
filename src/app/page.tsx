import Envelope from '@/components/Envelope';
import Invitation from '@/components/Invitation';
import Countdown from '@/components/Countdown';
import Details from '@/components/Details';
import Schedule from '@/components/Schedule';
import Rsvp from '@/components/Rsvp';
import Footer from '@/components/Footer';
import MusicPlayer from '@/components/MusicPlayer';

export default function Page() {
  return (
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
  );
}
