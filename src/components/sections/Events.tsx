import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, ChevronDown, Church, Clock, Heart, MapPin, Navigation, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { weddingConfig, type EventKind, type WeddingEvent } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { directionsUrl, downloadIcs, googleCalendarUrl } from '../../lib/links';
import { dateParts, formatTimeRange } from '../../lib/time';
import { Section, SectionHeading } from '../ui/Section';

const icons: Record<EventKind, typeof Church> = {
  ceremony: Church,
  reception: Sparkles,
  other: Heart,
};

function CalendarMenu({ ev }: { ev: WeddingEvent }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button type="button" className="btn-outline w-full px-3" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <CalendarPlus size={14} aria-hidden="true" />
        {t('addToCalendar')}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-lg border border-gold/30 bg-wine-950 shadow-card"
          >
            <a
              role="menuitem"
              href={googleCalendarUrl(ev)}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm hover:bg-gold/10"
              onClick={() => setOpen(false)}
            >
              {t('googleCalendar')}
            </a>
            <button
              role="menuitem"
              type="button"
              className="block w-full px-4 py-3 text-left text-sm hover:bg-gold/10"
              onClick={() => {
                downloadIcs(ev);
                setOpen(false);
              }}
            >
              {t('appleCalendar')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ ev, index }: { ev: WeddingEvent; index: number }) {
  const { t, tx, lang } = useI18n();
  const Icon = icons[ev.kind];
  const d = dateParts(ev.start, lang);
  const isMain = ev.kind === 'ceremony';

  return (
    <motion.article
      id={`event-${ev.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={`card group relative flex w-full scroll-mt-24 flex-col p-6 md:w-[calc(50%-0.75rem)] md:max-w-md transition-shadow hover:shadow-glow sm:p-7 ${
        isMain ? 'border-gold/50 ring-1 ring-gold/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/40 bg-wine-800 text-gold">
          <Icon size={24} strokeWidth={1.4} aria-hidden="true" />
          <span className="absolute inset-[-5px] rounded-full border border-dashed border-gold/25 motion-safe:group-hover:animate-[spin_12s_linear_infinite]" />
        </div>
        <div className="text-right font-display leading-none text-gold-soft">
          <span className="block text-4xl text-gold">{d.day}</span>
          <span className="text-xs uppercase tracking-[0.25em]">
            {d.month} {d.year}
          </span>
        </div>
      </div>

      <h3 className="mt-5 font-display text-3xl text-gold-soft">{tx(ev.name)}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
        <li className="flex gap-3">
          <Clock size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
          <span>
            {d.weekday} · {formatTimeRange(ev.start, ev.end, lang)}
          </span>
        </li>
        <li className="flex gap-3">
          <MapPin size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
          <span>
            <span className="text-cream">{tx(ev.venueName)}</span>
            <br />
            <span className="text-cream/60">{tx(ev.address)}</span>
          </span>
        </li>
        {ev.dressCode && (
          <li className="flex gap-3">
            <Shirt size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <span>
              <span className="text-cream/60">{t('dressCode')}: </span>
              {tx(ev.dressCode)}
            </span>
          </li>
        )}
      </ul>
      {ev.description && <p className="mt-4 flex-1 text-sm leading-relaxed text-cream/65">{tx(ev.description)}</p>}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <CalendarMenu ev={ev} />
        <a href={directionsUrl(ev.mapsQuery, ev.mapsUrl)} target="_blank" rel="noopener noreferrer" className="btn-gold flex-1 px-3">
          <Navigation size={14} aria-hidden="true" />
          {t('directions')}
        </a>
      </div>
    </motion.article>
  );
}

export function Events() {
  const { t } = useI18n();
  const events = weddingConfig.events
    .filter((e) => e.enabled)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  if (!events.length) return null;

  return (
    <Section id="events" label={t('eventsTitle')}>
      <SectionHeading title={t('eventsTitle')} sub={t('eventsSub')} />
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
        {events.map((ev, i) => (
          <EventCard key={ev.id} ev={ev} index={i} />
        ))}
      </div>
    </Section>
  );
}
