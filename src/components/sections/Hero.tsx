import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ChevronDown, CalendarPlus } from 'lucide-react';
import { useRef, type PointerEvent } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { googleCalendarUrl } from '../../lib/links';
import { dateParts } from '../../lib/time';
import { FloralCorner, GoldDivider } from '../ui/Florals';

const ease = [0.22, 1, 0.36, 1] as const;

/** Positions (in % of the frame) for the twinkling gold stars around the cover photo. */
const sparkles = [
  { left: -6, top: 12, size: 14, delay: 0 },
  { left: 104, top: 22, size: 10, delay: 1.1 },
  { left: -4, top: 48, size: 9, delay: 2.3 },
  { left: 103, top: 58, size: 15, delay: 0.6 },
  { left: 8, top: 90, size: 11, delay: 1.7 },
  { left: 92, top: 94, size: 9, delay: 2.8 },
  { left: 50, top: -5, size: 12, delay: 3.4 },
  { left: 24, top: 2, size: 8, delay: 2 },
];

function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
      {sparkles.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="sparkle absolute text-gold-soft drop-shadow-[0_0_6px_rgba(243,220,164,.9)]"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        >
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

/**
 * A ray of gold light that runs round and round the arch's border.
 * A large rotating conic gradient sits just behind the frame; only a thin
 * 3px rim of it shows around the photo's edge.
 */
function BorderLight({ ready }: { ready: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute -inset-[5px] overflow-hidden rounded-t-full blur-[0.5px] motion-reduce:hidden"
      initial={{ opacity: 0 }}
      animate={ready ? { opacity: 1 } : undefined}
      transition={{ delay: 2.2, duration: 1 }}
      aria-hidden="true"
    >
      <div
        className="absolute -inset-[50%] animate-[spin_6s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 220deg, rgb(var(--c-gold) / .7) 290deg, #fffaf0 338deg, #fff4d6 346deg, rgb(var(--c-gold-soft)) 354deg, transparent 360deg)',
        }}
      />
    </motion.div>
  );
}

/** Hearts and petals that drift up over the photo and fade away. */
const risers = [
  { left: 12, size: 19, delay: 0, dur: 9, kind: 'heart', color: '#E4AE9E' },
  { left: 30, size: 14, delay: 3.2, dur: 10, kind: 'petal', color: '#F6EBDD' },
  { left: 48, size: 18, delay: 6.1, dur: 8.5, kind: 'heart', color: '#D4AF6A' },
  { left: 66, size: 16, delay: 1.6, dur: 9.5, kind: 'petal', color: '#F0C6B8' },
  { left: 82, size: 21, delay: 4.6, dur: 10.5, kind: 'heart', color: '#E4AE9E' },
  { left: 22, size: 13, delay: 7.4, dur: 9, kind: 'petal', color: '#D4AF6A' },
  { left: 74, size: 14, delay: 8.8, dur: 8, kind: 'heart', color: '#F6EBDD' },
] as const;

function RisingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size] motion-reduce:hidden" aria-hidden="true">
      {risers.map((r, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="riser absolute bottom-0 drop-shadow-[0_0_4px_rgba(0,0,0,.35)]"
          style={{
            left: `${r.left}%`,
            width: r.size,
            height: r.size,
            color: r.color,
            animationDelay: `${r.delay + 3}s`,
            animationDuration: `${r.dur}s`,
          }}
        >
          {r.kind === 'heart' ? (
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.3 4.3 2.5.7-1.2 2.1-2.5 4.3-2.5 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor" />
          ) : (
            <path d="M12 2C17 7 18 13 12 22C6 13 7 7 12 2Z" fill="currentColor" />
          )}
        </svg>
      ))}
    </div>
  );
}

/** Letter-by-letter reveal for the couple's names; words never break mid-word. */
function AnimatedName({ text, delay, ready }: { text: string; delay: number; ready: boolean }) {
  const words = text.split(' ');
  let n = 0;
  return (
    <span aria-label={text}>
      {words.map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden="true">
          {Array.from(word).map((ch, i) => (
            <motion.span
              key={i}
              className="gold-text inline-block"
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={ready ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
              transition={{ delay: delay + n++ * 0.05, duration: 0.7, ease }}
            >
              {ch}
            </motion.span>
          ))}
          {w < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  );
}

export function Hero({ guest, ready }: { guest: string | null; ready: boolean }) {
  const { t, tx, lang } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Moves the whole frame (not the photo inside it), so nothing gets cropped.
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  // Mouse-follow tilt for the cover photo (mouse only; touch and reduced motion skip it).
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 14 });
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 14 });
  const onTilt = (e: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - r.left) / r.width - 0.5);
    pointerY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };
  const floralY = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const { couple, content, wedding, events } = weddingConfig;
  const d = dateParts(wedding.date, lang);
  const ceremony = events.find((e) => e.kind === 'ceremony' && e.enabled);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { delay, duration: 0.9, ease },
  });

  return (
    <section ref={ref} id="home" className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-24 pt-28 sm:px-6">
      <motion.div style={{ y: floralY }} className="absolute -left-20 -top-20 w-60 opacity-90 sm:w-80 lg:w-[26rem]">
        <FloralCorner className="w-full motion-safe:animate-sway" />
      </motion.div>
      <motion.div style={{ y: floralY }} className="absolute -bottom-24 -right-20 w-60 opacity-90 sm:w-80 lg:w-[26rem]">
        <FloralCorner flip="xy" className="w-full motion-safe:animate-sway" />
      </motion.div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div style={{ y: textY }} className="text-center">
          {guest && (
            <motion.p {...fade(0.1)} className="mb-4 font-script text-3xl text-gold-soft">
              {t('dear')} {guest},
            </motion.p>
          )}
          <motion.p {...fade(0.2)} className="eyebrow">
            {tx(content.eyebrow)}
          </motion.p>

          <h1 className="mt-6 font-display font-medium uppercase leading-[1.05] tracking-[0.1em]">
            <span className="block text-[clamp(2.25rem,7.5vw,4.75rem)]">
              <AnimatedName text={tx(couple.groom.name)} delay={0.4} ready={ready} />
            </span>
            <motion.span {...fade(1.1)} className="my-1 block font-script text-4xl normal-case tracking-normal text-gold sm:text-5xl">
              {t('and')}
            </motion.span>
            <span className="block text-[clamp(2.25rem,7.5vw,4.75rem)]">
              <AnimatedName text={tx(couple.bride.name)} delay={1.2} ready={ready} />
            </span>
          </h1>

          <motion.p {...fade(1.9)} className="mx-auto mt-6 max-w-md text-[0.7rem] uppercase tracking-[0.28em] text-cream/80">
            {tx(content.headline)}
          </motion.p>

          <motion.div {...fade(2.1)} className="mt-8 flex items-center justify-center gap-5 font-display text-gold-soft">
            <span className="text-lg uppercase tracking-[0.3em]">{d.month}</span>
            <span className="h-10 w-px bg-gold/50" />
            <span className="text-5xl font-medium text-gold">{d.day}</span>
            <span className="h-10 w-px bg-gold/50" />
            <span className="text-lg tracking-[0.2em]">{d.year}</span>
          </motion.div>
          <motion.p {...fade(2.2)} className="mt-3 text-[0.7rem] uppercase tracking-[0.25em] text-cream/70">
            {d.weekday} <span className="mx-2 text-gold/60">|</span> {d.time}
          </motion.p>

          <motion.p {...fade(2.3)} className="mx-auto mt-6 max-w-md font-display text-lg italic leading-relaxed text-cream/85">
            {tx(content.invitation)}
          </motion.p>

          <motion.div {...fade(2.5)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {ceremony && (
              <a href={googleCalendarUrl(ceremony)} target="_blank" rel="noopener noreferrer" className="btn-gold">
                <CalendarPlus size={15} aria-hidden="true" />
                {t('saveTheDate')}
              </a>
            )}
            <a href="#events" className="btn-outline">
              {t('events')}
            </a>
          </motion.div>
        </motion.div>

        {/* Couple portrait in an arched gold frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.8, duration: 1.2, ease }}
          className="relative mx-auto w-[min(72vw,300px)] [@media(min-height:500px)]:w-[min(78vw,380px,calc((100svh-11rem)*2/3))]"
        >
          {/* Gentle float, plus a 3D tilt that follows the mouse on desktop. */}
          <div className="motion-safe:animate-float [perspective:1000px]">
            <motion.div
              style={{ y: photoY, rotateX: tiltX, rotateY: tiltY }}
              onPointerMove={onTilt}
              onPointerLeave={resetTilt}
              className="relative"
            >
              <div className="absolute -inset-3 rounded-t-full border border-gold/30 motion-safe:animate-glow" aria-hidden="true" />
              <BorderLight ready={ready} />
              {/* Frame matches the photo's 2:3 shape so the whole picture shows. It rises open like a curtain. */}
              <motion.div
                initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                animate={ready ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
                transition={{ delay: 0.7, duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
                className="img-shine relative aspect-[2/3] overflow-hidden rounded-t-full border-2 border-gold/60 shadow-glow"
              >
                {/* Slow cinematic push-in towards the couple's faces, then back out (see .kenburns). */}
                <div className="kenburns h-full w-full" style={{ transformOrigin: couple.heroFocus }}>
                  <motion.img
                    src={asset(couple.heroPhoto)}
                    alt={`${tx(couple.groom.name)} & ${tx(couple.bride.name)}`}
                    initial={{ scale: 1.2, filter: 'blur(8px)' }}
                    animate={ready ? { scale: 1, filter: 'blur(0px)' } : undefined}
                    transition={{ delay: 0.8, duration: 2, ease }}
                    className="h-full w-full object-cover object-top"
                    {...{ fetchpriority: 'high' }}
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/40 via-transparent to-transparent" />
                <RisingHearts />
              </motion.div>
              <Sparkles />
            </motion.div>
          </div>
          <FloralCorner flip="x" className="absolute -right-12 -top-10 w-36 sm:w-44 [@media(max-height:500px)]:hidden" />
          <GoldDivider className="mx-auto mt-6" />
          <p className="mt-3 text-center font-script text-2xl text-gold">{couple.hashtag}</p>
        </motion.div>
      </div>

      <motion.a
        href="#family"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 3 }}
        className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[0.6rem] uppercase tracking-[0.3em] text-cream/60 sm:flex lg:bottom-6"
      >
        {t('scrollToExplore')}
        <ChevronDown size={18} className="text-gold motion-safe:animate-bounce" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
