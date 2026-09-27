type P = { className?: string };

/** جداکننده تزئینی: خط — لوزی — خط */
export function Divider({ className = '' }: P) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      aria-hidden
    >
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/80 sm:w-28" />
      <span className="block h-2 w-2 rotate-45 border border-gold/80 bg-gold/10" />
      <span className="block h-2.5 w-2.5 rotate-45 bg-gold shadow-[0_0_10px_rgba(201,162,39,0.7)]" />
      <span className="block h-2 w-2 rotate-45 border border-gold/80 bg-gold/10" />
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/80 sm:w-28" />
    </div>
  );
}

/** گل گوشه قاب (جهت پیش‌فرض: گوشه بالا-چپ — با scale بچرخانید) */
export function Corner({ className = '' }: P) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <path
        d="M92 10 H36 Q10 10 10 36 V92"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M92 24 H40 Q24 24 24 40 V92"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.65"
      />
      <rect
        x="17.5"
        y="17.5"
        width="13"
        height="13"
        transform="rotate(45 24 24)"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="92" cy="10" r="4" fill="currentColor" />
      <circle cx="10" cy="92" r="4" fill="currentColor" />
    </svg>
  );
}

/** قلب */
export function Heart({ className = '' }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/** آیکون تقویم */
export function CalendarIcon({ className = '' }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** آیکون ساعت */
export function ClockIcon({ className = '' }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** آیکون مکان */
export function PinIcon({ className = '' }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
