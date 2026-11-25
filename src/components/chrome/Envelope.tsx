import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { INTRO_SECONDS, playSound } from '../../lib/sound';
import { formatDate } from '../../lib/time';
import { FloralCorner, GoldDivider } from '../ui/Florals';

/**
 * Cinematic opening: a wine-velvet envelope with a gold wax seal.
 * Tapping the seal lifts the flap, slides the card up, then reveals the site.
 */
export function Envelope({
  guest,
  onStart,
  onOpen,
}: {
  guest: string | null;
  /** Runs during the tap itself — the only moment browsers allow sound to start. */
  onStart: () => void;
  onOpen: () => void;
}) {
  const { t, tx, lang } = useI18n();
  const reduce = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const { initials, groom, bride } = weddingConfig.couple;

  const open = () => {
    if (opening) return;
    setOpening(true);
    onStart();
    // Cinematic opening timed to the animation: seal crack, rising swell,
    // chimes as the card rises, then a soft bloom as the page appears and
    // the music fades in (see playSound('cinematic')).
    playSound(reduce ? 'chime' : 'cinematic');
    setTimeout(onOpen, reduce ? 50 : INTRO_SECONDS * 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-wine-950 px-4"
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('openInvitation')}
    >
      <FloralCorner className="absolute -left-10 -top-10 w-56 opacity-90 sm:w-80 [@media(max-height:500px)]:w-40" />
      <FloralCorner flip="xy" className="absolute -bottom-10 -right-10 w-56 opacity-90 sm:w-80 [@media(max-height:500px)]:w-40" />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 text-center [@media(max-height:500px)]:mb-3">
        {guest ? (
          <>
            <p className="eyebrow">{t('dear')}</p>
            <p className="mt-2 font-script text-4xl text-gold-soft sm:text-5xl">{guest}</p>
          </>
        ) : (
          <p className="eyebrow">{t('youAreInvited')}</p>
        )}
      </motion.div>

      {/* Envelope */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[1.45] w-[min(88vw,460px,calc((100svh-13rem)*1.45))] [perspective:1200px]"
      >
        {/* Back */}
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-wine-700 to-wine-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]" />

        {/* Card inside */}
        <motion.div
          className="absolute inset-x-[6%] top-[6%] bottom-[6%] flex flex-col items-center justify-center rounded-sm border border-gold/40 bg-gradient-to-b from-[#FBF3E6] to-[#F1E2CB] px-4 text-center text-wine-900"
          animate={opening ? { y: reduce ? 0 : '-58%' } : { y: 0 }}
          transition={{ delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ zIndex: opening ? 3 : 1 }}
        >
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-gold-deep sm:text-[0.65rem]">{tx(weddingConfig.content.eyebrow)}</p>
          <p className="mt-2 font-display text-xl uppercase tracking-[0.12em] sm:text-2xl">{tx(groom.name)}</p>
          <p className="font-script text-xl text-gold-deep">{t('and')}</p>
          <p className="font-display text-xl uppercase tracking-[0.12em] sm:text-2xl">{tx(bride.name)}</p>
          <p className="mt-2 text-[0.6rem] uppercase tracking-[0.25em] text-wine-700">
            {formatDate(weddingConfig.wedding.date, lang, { weekday: undefined })}
          </p>
        </motion.div>

        {/* Front pocket */}
        <div
          className="absolute inset-0 rounded-md"
          style={{
            zIndex: 2,
            background: 'linear-gradient(160deg, rgb(var(--c-wine-700)), rgb(var(--c-wine-800)))',
            clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top right, transparent 49.6%, rgb(var(--c-gold) / .35) 50%, transparent 50.4%), linear-gradient(to top left, transparent 49.6%, rgb(var(--c-gold) / .35) 50%, transparent 50.4%)',
            }}
          />
          <GoldDivider className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-70" />
        </div>

        {/* Flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[56%] origin-top"
          style={{
            zIndex: opening ? 0 : 4,
            background: 'linear-gradient(180deg, rgb(var(--c-wine-600)), rgb(var(--c-wine-700)))',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            transformStyle: 'preserve-3d',
          }}
          animate={opening ? { rotateX: 180 } : { rotateX: 0 }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
        />

        {/* Wax seal */}
        <motion.button
          type="button"
          onClick={open}
          aria-label={t('openInvitation')}
          className="absolute left-1/2 top-[56%] z-[5] grid h-20 w-20 place-items-center rounded-full sm:h-24 sm:w-24 [@media(max-height:500px)]:h-14 [@media(max-height:500px)]:w-14"
          style={{
            x: '-50%',
            y: '-50%',
            background: 'radial-gradient(circle at 35% 30%, #f6dfa7, #d4af6a 40%, #8e6526 100%)',
            boxShadow: '0 8px 20px rgba(0,0,0,.45), inset 0 -4px 8px rgba(80,50,10,.5), inset 0 3px 6px rgba(255,240,200,.6)',
          }}
          animate={opening ? { scale: 0, opacity: 0, rotate: 30 } : { scale: [1, 1.06, 1] }}
          transition={opening ? { duration: 0.4 } : { duration: 2.2, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="pointer-events-none absolute inset-[6px] rounded-full border border-dashed border-wine-900/40" />
          <span className="font-display text-2xl font-semibold text-wine-900 sm:text-3xl">
            {initials.groom}
            <span className="font-script text-lg">&amp;</span>
            {initials.bride}
          </span>
        </motion.button>
      </motion.div>

      <motion.button
        type="button"
        onClick={open}
        className="btn-gold mt-10 [@media(max-height:500px)]:mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ delay: opening ? 0 : 0.6 }}
      >
        {t('openInvitation')}
      </motion.button>
      <p className="mt-3 text-xs text-cream/50 [@media(max-height:500px)]:mt-1">{t('tapToOpen')}</p>
    </motion.div>
  );
}
