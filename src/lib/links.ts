import type { WeddingEvent } from '../config/weddingConfig';
import { weddingConfig } from '../config/weddingConfig';
import { localize } from './i18n';

const toUtcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Events shown as "… onwards" have no end; calendars still need one, so assume 2 hours. */
const eventEnd = (ev: WeddingEvent) => ev.end ?? new Date(new Date(ev.start).getTime() + 2 * 3_600_000).toISOString();

export const coupleTitle = () =>
  `${localize(weddingConfig.couple.groom.name, 'en')} & ${localize(weddingConfig.couple.bride.name, 'en')}`;

export function googleCalendarUrl(ev: WeddingEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${localize(ev.name, 'en')} · ${coupleTitle()}`,
    dates: `${toUtcStamp(ev.start)}/${toUtcStamp(eventEnd(ev))}`,
    details: `${localize(ev.description, 'en')}\n\n${invitationUrl()}`,
    location: `${localize(ev.venueName, 'en')}, ${localize(ev.address, 'en')}`,
    ctz: weddingConfig.wedding.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsEscape = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function downloadIcs(ev: WeddingEvent) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}-${toUtcStamp(ev.start)}@wedding-invitation`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(ev.start)}`,
    `DTEND:${toUtcStamp(eventEnd(ev))}`,
    `SUMMARY:${icsEscape(`${localize(ev.name, 'en')} · ${coupleTitle()}`)}`,
    `DESCRIPTION:${icsEscape(`${localize(ev.description, 'en')}\n${invitationUrl()}`)}`,
    `LOCATION:${icsEscape(`${localize(ev.venueName, 'en')}, ${localize(ev.address, 'en')}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  downloadBlob(blob, `${ev.id}.ics`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Opens the Google Maps app on phones (universal link) or the website on desktop.
 * An exact shared link from config (`mapsUrl`) is used when given.
 */
export function directionsUrl(query: string, mapsUrl?: string) {
  return mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/** Key-less embed; a custom `mapEmbedUrl` from config takes precedence. */
export function mapsEmbedUrl(query: string, custom?: string) {
  if (custom) return custom;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** The invitation URL — deliberately drops ?guest= so personal names are never forwarded. */
export function invitationUrl() {
  if (typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
    return `${window.location.origin}${import.meta.env.BASE_URL}`;
  }
  return weddingConfig.siteUrl;
}

export const shareText = () => `You're invited to the wedding of ${coupleTitle()}! 💍`;

export const whatsappShareUrl = () =>
  `https://wa.me/?text=${encodeURIComponent(`${shareText()}\nOpen the invitation: ${invitationUrl()}`)}`;
