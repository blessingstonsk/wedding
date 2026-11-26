import { CalendarDays, Clock, MapPin, Map as MapIcon, Navigation } from 'lucide-react';
import { useState } from 'react';
import { weddingConfig, type Venue } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { directionsUrl, mapsEmbedUrl } from '../../lib/links';
import { formatDate, formatTimeRange } from '../../lib/time';
import { Reveal, Section, SectionHeading } from '../ui/Section';

function VenueCard({ venue, index }: { venue: Venue; index: number }) {
  const { t, tx, lang } = useI18n();
  // The map iframe is heavy, so it only loads when a guest asks for it.
  const [showMap, setShowMap] = useState(false);
  const events = weddingConfig.events.filter((e) => e.enabled && venue.eventIds.includes(e.id));

  return (
    <Reveal delay={index * 0.15} className="card overflow-hidden">
      <div className="relative">
        {showMap ? (
          <iframe
            title={`${t('venue')}: ${tx(venue.name)}`}
            src={mapsEmbedUrl(venue.mapsQuery, venue.mapEmbedUrl)}
            className="aspect-[16/10] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <img
            src={asset(venue.photo)}
            alt={tx(venue.name)}
            loading="lazy"
            style={{ objectPosition: venue.photoPosition }}
            className="aspect-[16/10] w-full object-cover"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-wine-950/80 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold backdrop-blur">
          {tx(venue.label)}
        </span>
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="font-display text-3xl text-gold-soft">{tx(venue.name)}</h3>
        {/* Address, day and time each on their own line, with matching icons. */}
        <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
          <li className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <span>{tx(venue.address)}</span>
          </li>
          {events.map((ev) => [
            <li key={`${ev.id}-day`} className="flex items-start gap-3">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>{formatDate(ev.start, lang)}</span>
            </li>,
            <li key={`${ev.id}-time`} className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                <span className="text-cream">{tx(ev.name)}</span> · {formatTimeRange(ev.start, ev.end, lang)}
              </span>
            </li>,
          ])}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a href={directionsUrl(venue.mapsQuery, venue.mapsUrl)} target="_blank" rel="noopener noreferrer" className="btn-gold flex-1">
            <Navigation size={14} aria-hidden="true" />
            {t('getDirections')}
          </a>
          {!showMap && (
            <button type="button" className="btn-outline flex-1" onClick={() => setShowMap(true)}>
              <MapIcon size={14} aria-hidden="true" />
              {t('loadMap')}
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export function VenueSection() {
  const { t } = useI18n();
  const venues = weddingConfig.venues;
  if (!venues.length) return null;
  return (
    <Section id="venue" label={t('venueTitle')}>
      <SectionHeading title={t('venueTitle')} sub={t('venueSub')} />
      <div className={`mx-auto grid max-w-5xl gap-8 ${venues.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl'}`}>
        {venues.map((v, i) => (
          <VenueCard key={v.id} venue={v} index={i} />
        ))}
      </div>
    </Section>
  );
}
