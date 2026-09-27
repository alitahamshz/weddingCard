"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { weddingConfig } from "@/lib/config";
import { Divider, Heart } from "@/components/Ornament";
import Image from "next/image";
import { useGuest } from "@/components/GuestContext";
import { isLatinName } from "@/lib/guests";

/** شکوفه‌های طلایی چهارپر (موقعیت ثابت تا هایدریشن به‌هم نریزد) */
const PETALS = [
  { left: "1%", delay: "0s", dur: "12s", size: 10 },
  { left: "6%", delay: "5s", dur: "10s", size: 13 },
  { left: "10%", delay: "2.5s", dur: "11s", size: 9 },
  { left: "15%", delay: "1s", dur: "13s", size: 12 },
  { left: "19%", delay: "6.5s", dur: "9.5s", size: 8 },
  { left: "24%", delay: "4s", dur: "11s", size: 14 },
  { left: "29%", delay: "0.5s", dur: "12.5s", size: 10 },
  { left: "34%", delay: "6s", dur: "9s", size: 12 },
  { left: "38%", delay: "0.8s", dur: "12.5s", size: 9 },
  { left: "43%", delay: "3.2s", dur: "10.5s", size: 13 },
  { left: "47%", delay: "5.8s", dur: "11.8s", size: 8 },
  { left: "52%", delay: "1.7s", dur: "12s", size: 11 },
  { left: "57%", delay: "5.5s", dur: "9.5s", size: 14 },
  { left: "61%", delay: "2.9s", dur: "13.2s", size: 9 },
  { left: "66%", delay: "5s", dur: "11.5s", size: 12 },
  { left: "70%", delay: "2.2s", dur: "13s", size: 10 },
  { left: "75%", delay: "0.4s", dur: "10s", size: 13 },
  { left: "79%", delay: "6.8s", dur: "10.2s", size: 8 },
  { left: "84%", delay: "3.7s", dur: "12.8s", size: 11 },
  { left: "88%", delay: "1.2s", dur: "11.2s", size: 14 },
  { left: "92%", delay: "4.6s", dur: "10.8s", size: 9 },
  { left: "96%", delay: "2.8s", dur: "12.2s", size: 12 },
];

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** اگر کاربر تنظیم «کاهش انیمیشن» را روشن کرده باشد، پرش فوری می‌کنیم */
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * اسکرول با مدت زمان دلخواه و منحنی نرم (easeInOutCubic).
 * (رفتار smooth مرورگر مدت‌زمان قابل تنظیمی ندارد و برای این سناریو زیادی سریع است.)
 * خروجی: تابع لغو انیمیشن.
 */
function scrollToY(targetY: number, duration: number, onDone?: () => void) {
  const startY = window.scrollY;
  const maxY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const endY = Math.min(Math.max(targetY, 0), maxY);
  const delta = endY - startY;

  // در این پروژه «html { scroll-behavior: smooth }» فعال است؛ اگر آن را موقتاً
  // غیرفعال نکنیم، هر فریم خودش برای خودش یک انیمیشن نرم جدید می‌سازد و اسکرول
  // می‌پرد/گیر می‌کند. پس تا پایان انیمیشن رفتار را روی auto می‌گذاریم.
  const root = document.documentElement;
  const prevBehavior = root.style.scrollBehavior;
  const restore = () => {
    root.style.scrollBehavior = prevBehavior;
  };

  if (duration <= 0 || Math.abs(delta) < 1) {
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, endY);
    restore();
    onDone?.();
    return () => {};
  }

  root.style.scrollBehavior = "auto";

  // شروع و پایان نرم، میانه سریع‌تر
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let raf = 0;
  let cancelled = false;
  const start = performance.now();

  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min((now - start) / duration, 1);
    window.scrollTo(0, startY + delta * ease(t));
    if (t < 1) {
      raf = window.requestAnimationFrame(step);
    } else {
      restore();
      onDone?.();
    }
  };
  raf = window.requestAnimationFrame(step);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(raf);
    restore();
  };
}

/**
 * مدت زمان فرایند باز شدن با کلیک/لمس (جمعاً ۳ ثانیه):
 * ۱٫۸ ثانیه باز شدن پاکت + ۰٫۴ ثانیه مکث + ۰٫۸ ثانیه رفتن به بخش دوم
 */
const OPEN_SCROLL_MS = 3500;
const OPEN_HOLD_MS = 1200;
const NEXT_SCROLL_MS = 1400;

/**
 * صحنه آغازین: پاکت سه‌لتی واقع‌گرایانه که با اسکرول باز می‌شود.
 * ترتیب انیمیشن با پیشرفت اسکرول:
 * ۱) چرخش دو لت به دو طرف → ۲) نمایش اسم عروس و داماد
 */
export default function Envelope() {
  const ref = useRef<HTMLDivElement>(null);
  /** مهمان فعلی (از آدرس ?guest=…) — بدون آن، نسخه عمومی نمایش داده می‌شود */
  const guest = useGuest();
  // قفل ضد کلیک تکراری + تایمر رفتن خودکار به بخش دوم
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const cancelAnimRef = useRef<(() => void) | null>(null);

  // پاک‌سازی هنگام خروج از صفحه + واگذاری کنترل به کاربر اگر خودش اسکرول/لمس کند
  useEffect(() => {
    const stop = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (cancelAnimRef.current) {
        cancelAnimRef.current();
        cancelAnimRef.current = null;
      }
      busyRef.current = false;
    };
    const onInterrupt = () => {
      if (busyRef.current) stop();
    };
    window.addEventListener("wheel", onInterrupt, { passive: true });
    window.addEventListener("touchmove", onInterrupt, { passive: true });
    return () => {
      window.removeEventListener("wheel", onInterrupt);
      window.removeEventListener("touchmove", onInterrupt);
      stop();
    };
  }, []);

  /**
   * با کلیک/لمس روی کارت (جمعاً حدود ۳ ثانیه):
   * ۱) باز شدن تدریجی پاکت تا نقطه‌ای که دو لت کامل باز می‌شوند
   * ۲) مکث کوتاه روی کارت
   * ۳) رفتن خودکار و نرم به بخش دوم (کارت دعوت)
   */
  const handleOpenCard = () => {
    const el = ref.current as HTMLElement | null;
    if (!el || busyRef.current) return;

    const vh = window.innerHeight;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const openAt = sectionTop + Math.max(el.offsetHeight - vh, 0) * 0.46;
    const next = el.nextElementSibling as HTMLElement | null;
    const nextTop = next
      ? next.getBoundingClientRect().top + window.scrollY
      : sectionTop + el.offsetHeight;

    // مدت هر مرحله (در حالت «کاهش انیمیشن» صفر می‌شود)
    const reduced = prefersReducedMotion();
    const openMs = reduced ? 0 : OPEN_SCROLL_MS;
    const holdMs = reduced ? 0 : OPEN_HOLD_MS;
    const nextMs = reduced ? 0 : NEXT_SCROLL_MS;

    // اگر پاکت از قبل باز شده، فقط نرم به بخش بعدی می‌رویم
    if (window.scrollY >= openAt - 40) {
      busyRef.current = true;
      cancelAnimRef.current = scrollToY(nextTop, nextMs, () => {
        cancelAnimRef.current = null;
        busyRef.current = false;
      });
      return;
    }

    busyRef.current = true;

    // ۱) باز شدن پاکت (چرخش لت‌ها به پیشرفت اسکرول گره خورده است)
    cancelAnimRef.current = scrollToY(openAt, openMs, () => {
      cancelAnimRef.current = null;
      // ۲) مکث کوتاه تا باز شدن کامل دیده شود
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        // ۳) رفتن خودکار و نرم به بخش دوم (کارت دعوت)
        cancelAnimRef.current = scrollToY(nextTop, nextMs, () => {
          cancelAnimRef.current = null;
          busyRef.current = false;
        });
      }, holdMs);
    });
  };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // چرخش سه‌بعدی دو لت به طرفین (مثل باز شدن در)
  const leftDoor = useTransform(scrollYProgress, [0.02, 0.4], [0, -140]);
  const rightDoor = useTransform(scrollYProgress, [0.02, 0.4], [0, 140]);
  // سایه تماس درز وسط: با باز شدن محو می‌شود
  const seamShadow = useTransform(scrollYProgress, [0.02, 0.25], [1, 0]);
  // سه تصویر رینگ وسط نامه: هنگام باز شدن پاکت محو می‌شوند
  const ringsOpacity = useTransform(scrollYProgress, [0.02, 0.26], [1, 0]);
  // کل صحنه: کمی عقب‌نشینی هنگام باز شدن، بعد محو شدن برای ورود کارت اسم‌ها
  const stageScale = useTransform(
    scrollYProgress,
    [0.02, 0.4, 0.62, 0.78],
    [1, 0.72, 0.72, 0.6],
  );
  const sceneOpacity = useTransform(scrollYProgress, [0.62, 0.74], [1, 0]);
  const sceneY = useTransform(scrollYProgress, [0.62, 0.78], [0, 140]);
  // کارت اسم عروس و داماد
  const cardOpacity = useTransform(scrollYProgress, [0.68, 0.81], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.68, 0.84], [70, 0]);
  // راهنماها و پس‌زمینه
  const hintOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0]);
  const topTitleOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);

  return (
    <section ref={ref} className="relative h-[450vh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#FFFFFF_0%,#FDFBF4_100%)]">
        {/* والپیپر پشت کارت — بلر ملایم (≈۲۰٪) + حجاب سفید ۲۰٪ برای خوانایی */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src="/images/wallpaper.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-105 object-cover blur-[8px]"
          />
          <div className="absolute inset-0 bg-white/20" />
        </div>
        {/* بارش شکوفه‌های طلایی چهارپر */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {PETALS.map((p, i) => (
            <span
              key={i}
              className={`petal absolute -top-6 block blossom ${
                i % 2 === 0 ? "blossom-1" : "blossom-2"
              }`}
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
        </div>
        {/* نور محیطی ملایم (حذف دایرهٔ مشخص پس‌زمینه) */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute left-1/2 top-1/2 h-[70vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(233,206,122,0.4)_0%,rgba(233,206,122,0.14)_45%,transparent_72%)]"
          aria-hidden
        />

        {/* نوار پیشرفت باز شدن دعوت‌نامه */}
        <motion.div
          className="absolute inset-x-0 top-0 z-50 h-1 origin-center bg-gradient-to-l from-gold-dark via-gold to-gold-light"
          style={{ scaleX: scrollYProgress }}
        />

        {/* سطح قابل کلیک/لمس روی کارت: پاکت را باز می‌کند و سپس خودکار به بخش دوم می‌رود */}
        <button
          type="button"
          onClick={handleOpenCard}
          aria-label="باز کردن دعوت‌نامه و رفتن به جزئیات مراسم"
          className="absolute inset-0 z-40 cursor-pointer bg-transparent outline-none"
        />

        {/* عنوان بالای صفحه */}
        <motion.div
          style={{ opacity: topTitleOpacity }}
          className="absolute top-8 px-6 text-center sm:top-12"
        >
        {!guest && (
          <p className="font-display text-xl text-cocoa-800 sm:text-2xl">
            دعوتنامه‌ای برای شما رسیده است
          </p>
        )}
        {guest && (
          <p className="font-display text-xl text-cocoa-800 sm:text-2xl">
            دعوت‌نامه‌ای برای{" "}
            <span className="text-gold-deep">{guest.name}</span> رسیده است
          </p>
        )}
          <Divider className="mt-4" />
        </motion.div>

        {/* صحنه دعوت‌نامه سه‌لتی */}
        <motion.div
          style={{
            opacity: sceneOpacity,
            y: sceneY,
            scale: stageScale,
            width: "min(78vw, 460px, 60svh)",
          }}
          className="relative w-[min(78vw,460px)]"
        >
          <div className="animate-floaty-slow">
            <div style={{ perspective: 1800 }}>
              <div
                className="relative aspect-[3/4] w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* لت میانی (متن اصلی دعوت) */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-[8px] bg-white shadow-[0_1px_2px_rgba(60,45,10,0.12),0_14px_30px_-16px_rgba(60,45,10,0.4),0_34px_64px_-32px_rgba(60,45,10,0.5)]">
                  <div className="paper-surface absolute inset-0" />
                  <div className="paper-grain absolute inset-0 opacity-[0.18]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),transparent_30%)]" />
                  {/* گودی کناره‌ها: جایی که لت‌ها هنگام بسته بودن می‌نشستند */}
                  <div className="absolute inset-y-0 left-0 w-7 bg-[linear-gradient(to_right,rgba(138,109,27,0.16),transparent)]" aria-hidden />
                  <div className="absolute inset-y-0 right-0 w-7 bg-[linear-gradient(to_left,rgba(138,109,27,0.16),transparent)]" aria-hidden />
                  <div className="absolute inset-2.5 rounded-[6px] border border-gold/70" />
                  <div className="absolute inset-[9px] rounded-[5px] border border-gold/40" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-2 px-5 py-8 text-center">
                    <span className="font-display text-xs text-cocoa-700 sm:text-sm">
                      به نام خداوند عشق و مهربانی
                    </span>
                    <span
                      className="my-1 flex items-center gap-1.5"
                      aria-hidden
                    >
                      <span className="h-px w-10 bg-gold/70" />
                      <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
                      <span className="h-px w-10 bg-gold/70" />
                    </span>
                    <span className="text-gold-deep font-display text-[24px] leading-snug sm:text-[24px]">
                      {weddingConfig.bride}
                    </span>
                    <Heart className="my-1 h-4 w-4 text-gold-dark" />
                    <span className="text-gold-deep font-display text-2xl leading-snug sm:text-4xl">
                      {weddingConfig.groom}
                    </span>
                    <span className="mt-2 font-display text-sm text-cocoa-800 sm:text-base">
                      {weddingConfig.dateFa}
                    </span>
                    <span className="text-[10px] text-stone-500 sm:text-xs">
                      {weddingConfig.venue}
                    </span>
                  </div>
                </div>

                {/* لت چپ */}
                <motion.div
                  style={{ rotateY: leftDoor, transformOrigin: "0% 50%" }}
                  className="absolute bottom-0 left-0 top-0 z-20 w-[51%]"
                >
                  <div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* روی لت (جلد) */}
                    <div
                      className="flap-face absolute inset-0 overflow-hidden rounded-l-[8px] bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="paper-surface absolute inset-0" />
                      <div className="paper-grain absolute inset-0 opacity-[0.18]" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent_35%)]" />
                      {/* خط تای کاغذ در لبهٔ بیرونی: هایلایت تیز + سایهٔ گردش تا */}
                      <div className="absolute inset-y-4 left-0 w-4 bg-[linear-gradient(to_right,rgba(255,255,255,0.95),transparent)]" aria-hidden />
                      <div className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(to_right,rgba(138,109,27,0.4),rgba(138,109,27,0.05))]" aria-hidden />
                      <div className="absolute inset-y-2.5 left-2.5 right-1.5 rounded-l-[6px] rounded-r-[2px] border border-gold/70" />
                      {/* لبهٔ برش کنار درز وسط */}
                      <div className="absolute inset-y-0 right-0 w-px bg-[#8A6D1B]/40" aria-hidden />
                      <motion.div
                        style={{ opacity: seamShadow }}
                        className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#8A6D1B]/35 to-transparent"
                        aria-hidden
                      />
                      {/* اسم عروس به انگلیسی با فونت کشیده روی طرف پاکت */}
                      <div
                        dir="ltr"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center sm:px-6"
                      >
                        <span
                          className="h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                          aria-hidden
                        />
                        <span
                          className="flap-name font-script text-gold-deep p-2 text-[28px] leading-none tracking-[0.02em] sm:text-4xl"
                          style={{ textIndent: "0.02em" }}
                        >
                          {weddingConfig.brideEn}
                        </span>
                        <Heart className="h-3.5 w-3.5 text-gold-dark" />
                        <span dir="rtl" className="text-[10px] tracking-[0.2em] text-cocoa-600">
                          عروس
                        </span>
                        <span
                          className="h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                          aria-hidden
                        />
                      </div>
                      {/* تصویر گل: گوشهٔ بالای سمت چپ — قرینهٔ نقطه‌ای گوشهٔ پایین-راست (۱۸۰ درجه) */}
                      <Image
                        src="/images/flower.png"
                        alt=""
                        aria-hidden
                        width={160}
                        height={160}
                        className="absolute left-4 top-4 h-[160px] w-[160px] rotate-180 object-contain"
                      />
                      {/* ردیف اختصاصی مهمان: پایین لت چپ پاکت */}
                      {guest && (
                        <div className="pointer-events-none absolute inset-x-3 bottom-4 flex flex-col items-center">
                          <span className="text-[9px] leading-5 text-cocoa-600">
                            تقدیم به
                          </span>
                          <span
                            className={
                              isLatinName(guest.name)
                                ? "font-script text-gold-deep block text-[17px] leading-tight"
                                : "font-display text-cocoa-900 block text-[13px] leading-snug sm:text-sm"
                            }
                          >
                            {guest.name}
                          </span>
                          <span
                            className="mt-1 block h-px w-10 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                    {/* داخل لت */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-[8px] bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="paper-surface absolute inset-0" />
                      <div className="paper-grain absolute inset-0 opacity-[0.18]" />
                      {/* سایه لبهٔ تا (لولا) هنگام باز شدن */}
                      <div className="absolute inset-y-0 left-0 w-6 bg-[linear-gradient(to_right,rgba(138,109,27,0.14),transparent)]" aria-hidden />
                      <div className="absolute inset-y-2.5 left-2.5 right-1.5 rounded-l-[6px] rounded-r-[2px] border border-gold/50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
                        <span className="font-display text-[11px] leading-6 text-cocoa-800 sm:text-xs">
                          دست در دست هم، با قلبی لبریز از عشق
                        </span>
                        <span
                          className="block h-1.5 w-1.5 rotate-45 bg-gold"
                          aria-hidden
                        />
                        <span className="text-[10px] leading-6 text-stone-500 sm:text-[11px]">
                          حضور سبز شما
                          <br />
                          شادی ما را کامل می‌کند
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* لت راست */}
                <motion.div
                  style={{ rotateY: rightDoor, transformOrigin: "100% 50%" }}
                  className="absolute bottom-0 right-0 top-0 z-20 w-[51%]"
                >
                  <div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* روی لت (جلد) */}
                    <div
                      className="flap-face absolute inset-0 overflow-hidden rounded-r-[8px] bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="paper-surface absolute inset-0" />
                      <div className="paper-grain absolute inset-0 opacity-[0.18]" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent_35%)]" />
                      {/* خط تای کاغذ در لبهٔ بیرونی: هایلایت تیز + سایهٔ گردش تا */}
                      <div className="absolute inset-y-4 right-0 w-4 bg-[linear-gradient(to_left,rgba(255,255,255,0.95),transparent)]" aria-hidden />
                      <div className="absolute inset-y-0 right-0 w-[3px] bg-[linear-gradient(to_left,rgba(138,109,27,0.4),rgba(138,109,27,0.05))]" aria-hidden />
                      <div className="absolute inset-y-2.5 left-1.5 right-2.5 rounded-l-[2px] rounded-r-[6px] border border-gold/70" />
                      {/* لبهٔ برش کنار درز وسط */}
                      <div className="absolute inset-y-0 left-0 w-px bg-[#8A6D1B]/40" aria-hidden />
                      <motion.div
                        style={{ opacity: seamShadow }}
                        className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#8A6D1B]/35 to-transparent"
                        aria-hidden
                      />
                      {/* اسم داماد به انگلیسی با فونت کشیده روی طرف پاکت */}
                      <div
                        dir="ltr"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center sm:px-6"
                      >
                        <span
                          className="h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                          aria-hidden
                        />
                        <span
                          className="flap-name font-script text-gold-deep p-2 text-[28px] leading-none tracking-[0.02em] sm:text-4xl"
                          style={{ textIndent: "0.02em" }}
                        >
                          {weddingConfig.groomEn}
                        </span>
                        <Heart className="h-3.5 w-3.5 text-gold-dark" />
                        <span dir="rtl" className="text-[10px] tracking-[0.2em] text-cocoa-600">
                          داماد
                        </span>
                        <span
                          className="h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                          aria-hidden
                        />
                      </div>
                      {/* تصویر گل: گوشهٔ پایین-راست لت راست */}
                      <Image
                        src="/images/flower.png"
                        alt=""
                        aria-hidden
                        width={160}
                        height={160}
                        className="absolute bottom-4 right-4 h-[160px] w-[160px] object-contain"
                      />
                    </div>
                    {/* داخل لت */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-r-[8px] bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="paper-surface absolute inset-0" />
                      <div className="paper-grain absolute inset-0 opacity-[0.18]" />
                      {/* سایه لبهٔ تا (لولا) هنگام باز شدن */}
                      <div className="absolute inset-y-0 right-0 w-6 bg-[linear-gradient(to_left,rgba(138,109,27,0.14),transparent)]" aria-hidden />
                      <div className="absolute inset-y-2.5 left-1.5 right-2.5 rounded-l-[2px] rounded-r-[6px] border border-gold/50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
                        <span className="font-display text-xs text-cocoa-900 sm:text-sm">
                          {weddingConfig.dateFa}
                        </span>
                        <span className="text-[10px] text-stone-500 sm:text-[11px]">
                          {weddingConfig.timeFa}
                        </span>
                        <span
                          className="block h-1.5 w-1.5 rotate-45 bg-gold"
                          aria-hidden
                        />
                        <span className="text-[10px] leading-5 text-stone-500 sm:text-[11px]">
                          {weddingConfig.venue}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {/* سه تصویر رینگ وسط نامه — هنگام باز شدن محو می‌شوند */}
                <motion.div
                  style={{ opacity: ringsOpacity }}
                  className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center gap-2 sm:gap-4"
                  aria-hidden
                >
                  {[0].map((i) => (
                    <Image
                      key={i}
                      src="/images/ring.png"
                      alt=""
                      width={90}
                      height={90}
                      className="h-[100px] w-[100px] shrink-0 object-contain"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

          {/* سایه زیر دعوت‌نامه (دولایه برای عمق واقعی) */}
          <div className="relative mx-auto mt-5 h-6 w-3/4" aria-hidden>
            <div className="absolute inset-0 rounded-[100%] bg-[#8A6D1B]/20 blur-xl" />
            <div className="absolute inset-x-[20%] top-1 h-3 rounded-[100%] bg-[#5C4610]/25 blur-md" />
          </div>
        </motion.div>

        {/* کارت اسم عروس و داماد (بعد از باز شدن کامل) */}
        <motion.div
          style={{ opacity: cardOpacity, y: cardY }}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="font-display text-lg text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] sm:text-xl">
            به نام خداوند عشق و مهربانی
          </p>
          <Divider className="my-5 w-full max-w-xs" />
          {guest && (
            <p className="mt-1 rounded-full border border-white/40 bg-white/15 px-4 py-1 text-xs text-white backdrop-blur-sm sm:text-sm">
              تقدیم به <span className="font-display text-white-gold">{guest.name}</span>
            </p>
          )}
          <h1 className="font-display text-5xl leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-7xl">
            <span className="text-white-gold">{weddingConfig.bride}</span>
            <span className="mx-3 align-middle text-3xl text-white sm:text-4xl">
              و
            </span>
            <span className="text-white-gold">{weddingConfig.groom}</span>
          </h1>
          <p
            dir="ltr"
            className="font-en text-white-gold drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] mt-3 text-base font-light tracking-[0.45em] sm:text-xl"
            style={{ textIndent: "0.45em" }}
          >
            {weddingConfig.brideEn} &amp; {weddingConfig.groomEn}
          </p>
          <p className="mt-2 max-w-md leading-8 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
            با کمال مسرت، شما را به جشن پیوندمان دعوت می‌کنیم
          </p>
          <p className="mt-3 font-display text-lg text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
            {weddingConfig.dateFa}
          </p>
          <div className="mt-10 flex flex-col items-center gap-2 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
            <span className="text-xs">
              برای دیدن جزئیات جشن، لمس کنید
            </span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.span>
          </div>
        </motion.div>

        {/* راهنمای اسکرول ابتدای صفحه */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-7 flex flex-col items-center gap-2 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] sm:bottom-9"
        >
          <span className="text-center text-sm leading-6">
            لمس کنید یا اسکرول کنید
            <br />
            تا دعوت‌نامه باز شود
          </span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
