import { weddingConfig } from '../config/weddingConfig';
import type { Lang } from './i18n';

const TZ = weddingConfig.wedding.timeZone;

const locale = (lang: Lang) => (lang === 'ta' ? 'ta-IN' : 'en-IN');

export function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatTimeRange(start: string, end: string, lang: Lang) {
  return `${formatTime(start, lang)} – ${formatTime(end, lang)}`;
}

/** Year, month (1-12) and day of an instant as seen in the wedding time zone. */
export function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function dateParts(iso: string, lang: Lang) {
  const d = new Date(iso);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale(lang), { timeZone: TZ, ...o }).format(d);
  return {
    month: fmt({ month: 'short' }),
    day: fmt({ day: '2-digit' }),
    year: fmt({ year: 'numeric' }),
    weekday: fmt({ weekday: 'long' }),
    time: formatTime(iso, lang),
  };
}

export function sameZonedDay(a: Date, b: Date) {
  const x = zonedParts(a);
  const y = zonedParts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}
