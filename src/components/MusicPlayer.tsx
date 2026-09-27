'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ملودی آرام الهام‌گرفته از دستگاه شور (فرکانس هرتز، کشش به ضرب).
 * صفر یعنی سکوت.
 */
const MELODY: Array<[number, number]> = [
  [440.0, 1],
  [659.25, 1],
  [587.33, 1],
  [554.37, 1],
  [587.33, 1],
  [659.25, 1],
  [698.46, 2],
  [659.25, 1],
  [587.33, 1],
  [554.37, 1],
  [587.33, 1],
  [466.16, 1],
  [440.0, 2],
  [0, 1],
  [659.25, 1],
  [698.46, 1],
  [830.61, 1],
  [880.0, 2],
  [830.61, 1],
  [698.46, 1],
  [659.25, 1],
  [587.33, 1],
  [554.37, 1],
  [587.33, 1],
  [466.16, 1],
  [440.0, 2],
  [0, 1],
];

/** موتور تولید موزیک ملایم با WebAudio (بدون نیاز به فایل صوتی) */
class GenerativeMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private readonly beat = 0.44;
  playing = false;

  start() {
    if (this.playing) return;
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    void ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    // فضای لطیف با دیلی
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    this.master = master;
    this.startDrone();
    this.playing = true;
    this.step = 0;
    this.schedule();
  }

  private startDrone() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    [110, 164.81, 220].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.012 : 0.03;
      osc.connect(g);
      g.connect(master);
      osc.start();
    });
  }

  private pluck(freq: number, seconds: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = freq * 2;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.15;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.26, t + 0.02);
    env.gain.exponentialRampToValueAtTime(
      0.0001,
      t + Math.max(1.1, seconds * 1.6),
    );
    osc.connect(env);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(env);
    env.connect(master);
    osc.start(t);
    shimmer.start(t);
    const stopAt = t + Math.max(1.3, seconds * 1.8);
    osc.stop(stopAt);
    shimmer.stop(stopAt);
  }

  private schedule = () => {
    if (!this.playing) return;
    const [freq, beats] = MELODY[this.step % MELODY.length];
    if (freq > 0) this.pluck(freq, beats * this.beat);
    this.step += 1;
    this.timer = setTimeout(this.schedule, beats * this.beat * 1000);
  };

  stop() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
    this.master = null;
  }
}

/**
 * دکمه شناور موزیک (سکه طلایی).
 * اگر فایلی با نام music.mp3 در پوشه public بگذارید، همان پخش می‌شود؛
 * در غیر این صورت موزیک ملایم داخلی (تولیدشده با WebAudio) پخش می‌شود.
 */
export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [hasMp3, setHasMp3] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const engineRef = useRef<GenerativeMusic | null>(null);
  /** کاربر دستی موزیک را قطع کرده؟ (برای جلوگیری از پخش خودکار دوباره) */
  const userStoppedRef = useRef(false);
  /** پخش بی‌صدا آغاز شده و منتظر اولین تعامل برای وصل کردن صدا */
  const pendingUnmuteRef = useRef(false);

  // پخش خودکار از لحظهٔ باز شدن صفحه (دو مسیر):
  // ۱) پخش با صدا — اگر مرورگر اجازه دهد همان لود اولیه صدا می‌آید
  // ۲) اگر بلاک کرد، پخش «بی‌صدا» شروع می‌شود (در همهٔ مرورگرها مجاز است) و
  //    صدا با اولین اسکرول/لمس/کلیک کاربر وصل می‌شود — عملاً بلافاصله
  useEffect(() => {
    if (!hasMp3) return;
    let lastTry = 0;
    let warned = false;
    const failLog = (e: unknown) => {
      if (warned) return;
      warned = true;
      console.warn('[music] پخش خودکار ممکن نشد:', e);
    };
    /** همگام‌سازی وضعیت دکمه با وضعیت واقعی پخش */
    const syncState = () => {
      const a = audioRef.current;
      if (!a || userStoppedRef.current || a.paused) return;
      pendingUnmuteRef.current = a.muted;
      setPlaying(true);
    };
    /** شروع بی‌صدا (در همهٔ مرورگرها بدون تعامل مجاز است) */
    let optimisticTried = false;
    const silentStart = () => {
      const a = audioRef.current;
      if (!a || userStoppedRef.current || !a.paused) return;
      a.muted = true;
      void a
        .play()
        .then(() => {
          pendingUnmuteRef.current = true;
          setPlaying(true);
          // یک بار تلاش برای وصل صدا بدون تعامل؛ اگر مرورگر دوباره بی‌صدا کرد،
          // مسیر تعامل (onGesture) صدا را وصل می‌کند
          if (optimisticTried) return;
          optimisticTried = true;
          window.setTimeout(() => {
            const b = audioRef.current;
            if (!b || userStoppedRef.current) return;
            b.muted = false;
            if (!b.muted && !b.paused) {
              pendingUnmuteRef.current = false; // صدا وصل شد!
            } else if (b.paused) {
              silentStart(); // مرورگر پخش را متوقف کرد → شروع دوبارهٔ بی‌صدا
            }
          }, 350);
        })
        .catch(failLog);
    };
    /** تلاش برای پخش با صدا؛ اگر مرورگر بلاک کرد، شروع بی‌صدا */
    const tryAudible = () => {
      const a = audioRef.current;
      if (!a || userStoppedRef.current) return;
      if (!a.paused) {
        syncState();
        return;
      }
      void a
        .play()
        .then(() => {
          a.muted = false;
          pendingUnmuteRef.current = false;
          setPlaying(true);
        })
        .catch((e: unknown) => {
          failLog(e);
          silentStart();
        });
    };
    /** اولین تعامل کاربر: وصل کردن صدا (یا شروع پخش) */
    const onGesture = () => {
      const a = audioRef.current;
      if (!a || userStoppedRef.current) return;
      if (pendingUnmuteRef.current && !a.paused) {
        a.muted = false;
        if (!a.muted) {
          pendingUnmuteRef.current = false;
          setPlaying(true);
        }
        return;
      }
      if (!a.paused) {
        syncState();
        return;
      }
      const now = Date.now();
      if (now - lastTry < 300) return;
      lastTry = now;
      tryAudible();
    };
    tryAudible(); // لحظهٔ لود اولیه
    const events = [
      'pointerdown',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
    ] as const;
    events.forEach((e) =>
      window.addEventListener(e, onGesture, { passive: true }),
    );
    audioRef.current?.addEventListener('loadeddata', tryAudible);
    const timer = window.setInterval(onGesture, 2500);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onGesture));
      audioRef.current?.removeEventListener('loadeddata', tryAudible);
      window.clearInterval(timer);
      engineRef.current?.stop();
    };
  }, [hasMp3]);

  const toggle = () => {
    if (hasMp3 && audioRef.current) {
      const el = audioRef.current;
      if (playing) {
        el.pause();
        userStoppedRef.current = true;
        setPlaying(false);
      } else {
        userStoppedRef.current = false;
        pendingUnmuteRef.current = false;
        el.muted = false;
        el.currentTime = 0; // شروع از ابتدا
        void el
          .play()
          .then(() => setPlaying(true))
          .catch(() => undefined);
      }
      return;
    }
    if (!engineRef.current) engineRef.current = new GenerativeMusic();
    if (playing) {
      engineRef.current.stop();
      setPlaying(false);
    } else {
      engineRef.current.start();
      setPlaying(engineRef.current.playing);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/Ed.mp3"
        autoPlay
        loop
        preload="auto"
        onError={() => setHasMp3(false)}
      />
      <div className="fixed bottom-5 left-5 z-50 flex flex-col items-center gap-2">
        <button
          onClick={toggle}
          title={playing ? 'توقف موزیک' : 'پخش موزیک'}
          aria-label={playing ? 'توقف موزیک' : 'پخش موزیک'}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-white text-black shadow-xl shadow-gold/30 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {!playing && (
            <span
              className="animate-soft-ping absolute inset-0 rounded-full bg-gold/40"
              aria-hidden
            />
          )}
          {playing ? (
            <span className="flex h-5 items-end gap-[3px]" aria-hidden>
              <span
                className="eq-bar h-full w-[3px] rounded-full bg-black"
                style={{ animationDelay: '0s' }}
              />
              <span
                className="eq-bar h-full w-[3px] rounded-full bg-black"
                style={{ animationDelay: '0.25s' }}
              />
              <span
                className="eq-bar h-full w-[3px] rounded-full bg-black"
                style={{ animationDelay: '0.5s' }}
              />
              <span
                className="eq-bar h-full w-[3px] rounded-full bg-black"
                style={{ animationDelay: '0.15s' }}
              />
            </span>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          )}
        </button>
        <span className="rounded-full border border-gold/40 bg-white/85 px-2.5 py-1 text-[10px] text-gold-dark shadow backdrop-blur">
          موزیک
        </span>
      </div>
    </>
  );
}
