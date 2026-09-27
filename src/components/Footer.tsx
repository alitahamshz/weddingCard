import { weddingConfig } from '@/lib/config';
import { Heart } from '@/components/Ornament';

/** پاورقی پایانی */
export default function Footer() {
  const mono = `${weddingConfig.bride.charAt(0)} • ${weddingConfig.groom.charAt(0)}`;
  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#FBF5E8] to-champagne/60 px-4 pb-10 pt-14 text-center">
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/70 bg-white font-display text-2xl leading-none text-gold-dark shadow-[0_6px_20px_rgba(138,109,27,0.3)]">
        {mono}
      </div>
      <p className="mt-4 font-display text-3xl leading-snug sm:text-4xl">
        <span className="text-gold-deep">
          {weddingConfig.bride} و {weddingConfig.groom}
        </span>
      </p>
      <p className="mt-1 font-display text-sm text-cocoa-700">
        {weddingConfig.dateFa}
      </p>
      <p className="mt-4 text-sm leading-7 text-stone-500">
        منتظر دیدار شما در زیباترین شب زندگیمان هستیم
      </p>
      <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-xs text-stone-400">
        <span>ساخته شده با</span>
        <Heart className="h-3.5 w-3.5 text-gold" />
        <span>
          برای {weddingConfig.bride} و {weddingConfig.groom}
        </span>
      </div>
    </footer>
  );
}
