import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { playSound } from '../../lib/sound';
import { Section, SectionHeading } from '../ui/Section';

const photos = weddingConfig.gallery.photos;

function Lightbox({ index, onClose, onIndex }: { index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const { t, tx } = useI18n();
  const [dir, setDir] = useState(0);
  const [playing, setPlaying] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = photos[index];

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      playSound('swish');
      onIndex((index + delta + photos.length) % photos.length);
    },
    [index, onIndex],
  );

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prevFocus?.focus();
    };
  }, [go, onClose]);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => go(1), weddingConfig.gallery.autoplaySeconds * 1000);
    return () => clearTimeout(id);
  }, [playing, index, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col bg-wine-950/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={tx(photo.caption)}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-xs tracking-[0.2em] text-cream/60">
          {index + 1} / {photos.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold/10"
            aria-label={playing ? t('pause') : t('slideshow')}
            aria-pressed={playing}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold/10"
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-16">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={index}
            src={asset(photo.src)}
            alt={tx(photo.caption)}
            custom={dir}
            initial={{ opacity: 0, x: dir * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -80 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            className="max-h-[72svh] max-w-full cursor-grab touch-pan-y rounded-lg object-contain shadow-card active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-3 hidden h-12 w-12 place-items-center rounded-full border border-gold/30 bg-wine-900/70 text-gold hover:bg-gold/10 sm:grid"
          aria-label={t('previous')}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-3 hidden h-12 w-12 place-items-center rounded-full border border-gold/30 bg-wine-900/70 text-gold hover:bg-gold/10 sm:grid"
          aria-label={t('next')}
        >
          <ChevronRight />
        </button>
      </div>
      <p className="px-6 pb-10 pt-4 text-center font-display text-xl italic text-gold-soft">{tx(photo.caption)}</p>
    </motion.div>
  );
}

export function Gallery() {
  const { t, tx } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;

  return (
    <Section id="gallery" label={t('galleryTitle')}>
      <SectionHeading title={t('galleryTitle')} sub={t('gallerySub')} />
      <div className="mx-auto max-w-6xl columns-2 gap-3 sm:gap-4 md:columns-3">
        {photos.map((p, i) => (
          <motion.button
            key={p.src}
            type="button"
            onClick={() => {
              playSound('swish');
              setOpen(i);
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            className="img-shine-hover group relative mb-3 block w-full overflow-hidden rounded-xl border border-gold/20 transition-[border-color,box-shadow] duration-500 hover:border-gold/60 hover:shadow-glow sm:mb-4"
            aria-label={tx(p.caption)}
          >
            <img
              src={asset(p.src)}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ aspectRatio: String(p.ratio) }}
              className="w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-110"
            />
            <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-wine-950/90 to-transparent p-3 text-left font-display text-sm italic text-gold-soft opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:text-base">
              {tx(p.caption)}
            </span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>{open !== null && <Lightbox index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </Section>
  );
}
