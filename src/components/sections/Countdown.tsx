import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { useMemo, useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useCountdown } from '../../hooks/useCountdown';
import { useI18n, type UiKey } from '../../lib/i18n';
import { formatTime, sameZonedDay, zonedParts } from '../../lib/time';
import { Mandala } from '../ui/Florals';
import { Reveal, Section, SectionHeading } from '../ui/Section';

function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1.1em] w-[0.62em] overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 text-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label, pad = 2 }: { value: number; label: string; pad?: number }) {
  const digits = String(value).padStart(pad, '0').split('');
  return (
    <div className="card flex min-w-0 flex-col items-center px-1 py-5 sm:px-5 sm:py-7">
      <span className="font-serif text-3xl tabular-nums text-gold-soft sm:text-6xl" aria-hidden="true">
        {digits.map((d, i) => (
          <Digit key={digits.length - i} value={d} />
        ))}
      </span>
      <span className="mt-2 text-[0.55rem] uppercase tracking-[0.18em] text-cream/60 sm:text-xs sm:tracking-[0.25em]">{label}</span>
    </div>
  );
}

const enabledEvents = () => weddingConfig.events.filter((e) => e.enabled);

function WeddingCalendar() {
  const { t, tx, lang } = useI18n();
  const events = enabledEvents();
  const months = useMemo(() => {
    const seen = new Map<string, { year: number; month: number }>();
    for (const e of events) {
      const p = zonedParts(new Date(e.start));
      seen.set(`${p.year}-${p.month}`, { year: p.year, month: p.month });
    }
    return [...seen.values()].sort((a, b) => a.year - b.year || a.month - b.month);
  }, [events]);

  const weddingParts = zonedParts(new Date(weddingConfig.wedding.date));
  const [monthIdx, setMonthIdx] = useState(() =>
    Math.max(0, months.findIndex((m) => m.year === weddingParts.year && m.month === weddingParts.month)),
  );
  const [selected, setSelected] = useState<number>(weddingParts.day);

  const current = months[monthIdx] ?? { year: weddingParts.year, month: weddingParts.month };
  const first = new Date(Date.UTC(current.year, current.month - 1, 1));
  const daysInMonth = new Date(Date.UTC(current.year, current.month, 0)).getUTCDate();
  const offset = first.getUTCDay();
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN';
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + i))),
  );

  const eventsOn = (day: number) => {
    const probe = new Date(`${current.year}-${String(current.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00+05:30`);
    return events.filter((e) => sameZonedDay(new Date(e.start), probe));
  };
  const selectedEvents = eventsOn(selected);
  const isWeddingDay = (day: number) =>
    current.year === weddingParts.year && current.month === weddingParts.month && day === weddingParts.day;

  return (
    <div className="card mx-auto w-full max-w-md p-5 sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
          onClick={() => setMonthIdx((i) => i - 1)}
          disabled={monthIdx <= 0}
          aria-label={t('previous')}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="eyebrow">{t('weddingCalendar')}</p>
          <p className="mt-1 font-display text-2xl text-gold-soft">{monthLabel}</p>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
          onClick={() => setMonthIdx((i) => i + 1)}
          disabled={monthIdx >= months.length - 1}
          aria-label={t('next')}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-cream/45" aria-hidden="true">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const has = eventsOn(day).length > 0;
          const isSel = selected === day;
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={isSel}
              aria-label={`${day}${has ? ` — ${eventsOn(day).map((e) => tx(e.name)).join(', ')}` : ''}`}
              onClick={() => setSelected(day)}
              className={`relative grid aspect-square place-items-center rounded-full text-sm transition ${
                isSel
                  ? 'bg-gold font-medium text-wine-950'
                  : has
                    ? 'text-gold-soft hover:bg-gold/15'
                    : 'text-cream/45 hover:bg-cream/5'
              } ${isWeddingDay(day) && !isSel ? 'ring-1 ring-gold' : ''}`}
            >
              {day}
              {has && !isSel && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold" />}
            </button>
          );
        })}
      </div>
      <div className="mt-5 min-h-[4.5rem] border-t border-gold/15 pt-4" aria-live="polite">
        {selectedEvents.length ? (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <a href={`#event-${e.id}`} className="flex items-baseline justify-between gap-3 text-sm hover:text-gold">
                  <span className="font-display text-lg text-gold-soft">{tx(e.name)}</span>
                  <span className="text-xs text-cream/60">{formatTime(e.start, lang)}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-xs text-cream/50">{t('noEventsThatDay')}</p>
        )}
        <p className="mt-3 text-center text-[0.65rem] text-cream/40">{t('calendarHint')}</p>
      </div>
    </div>
  );
}

export function CountdownSection() {
  const { t, tx } = useI18n();
  const c = useCountdown(weddingConfig.wedding.date);
  const { content } = weddingConfig;
  const weddingDayOngoing = c.passed && c.elapsedMs < 24 * 3_600_000;

  const units: { key: UiKey; value: number; pad?: number }[] = [
    { key: 'days', value: c.days, pad: c.days > 99 ? 3 : 2 },
    { key: 'hours', value: c.hours },
    { key: 'minutes', value: c.minutes },
    { key: 'seconds', value: c.seconds },
  ];

  return (
    <Section id="countdown" label={t('countdownTitle')} className="overflow-hidden">
      <Mandala className="pointer-events-none absolute left-1/2 top-10 h-[34rem] w-[34rem] -translate-x-1/2 text-gold/[0.06]" />
      <SectionHeading title={c.passed ? t('marriedFor') : t('countdownTitle')} />

      {c.passed && (
        <Reveal className="mx-auto mb-10 flex max-w-xl flex-col items-center text-center">
          <PartyPopper className="text-gold" size={32} aria-hidden="true" />
          <p className="mt-4 font-display text-2xl italic text-gold-soft sm:text-3xl">
            {tx(weddingDayOngoing ? content.weddingDayGreeting : content.afterWedding)}
          </p>
        </Reveal>
      )}

      {(!c.passed || weddingConfig.wedding.marriedSince) && (
        <Reveal>
          <div
            className="mx-auto grid max-w-3xl grid-cols-4 gap-2 sm:gap-5"
            role="timer"
            aria-label={`${c.days} ${t('days')}, ${c.hours} ${t('hours')}, ${c.minutes} ${t('minutes')}`}
          >
            {units.map((u) => (
              <Unit key={u.key} value={u.value} pad={u.pad} label={t(u.key)} />
            ))}
          </div>
        </Reveal>
      )}

      <Reveal className="mt-16">
        <WeddingCalendar />
      </Reveal>
    </Section>
  );
}
