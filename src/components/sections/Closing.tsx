import { Heart, MessageCircle, Phone } from 'lucide-react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { whatsappShareUrl } from '../../lib/links';
import { formatDate, formatTime } from '../../lib/time';
import { FloralCorner, GoldDivider, Monogram } from '../ui/Florals';
import { Reveal } from '../ui/Section';

export function Closing() {
  const { t, tx, lang } = useI18n();
  const { couple, content, wedding, venues, contact } = weddingConfig;
  const venue = venues[0];
  const year = new Date(wedding.date).getFullYear();

  return (
    <>
      <section id="closing" className="relative overflow-hidden px-4 py-24 text-center sm:px-6 sm:py-32">
        <FloralCorner className="absolute -left-14 -top-14 w-56 opacity-80 motion-safe:animate-sway sm:w-80" />
        <FloralCorner flip="xy" className="absolute -bottom-14 -right-14 w-56 opacity-80 motion-safe:animate-sway sm:w-80" />
        <Reveal className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-4xl uppercase leading-tight tracking-[0.08em] text-gold-soft sm:text-5xl">{t('closingTitle')}</h2>
          <GoldDivider className="mx-auto mt-6" />
          <p className="mx-auto mt-6 max-w-xl font-display text-xl italic leading-relaxed text-cream/85">{tx(content.closing)}</p>
          <p className="mt-10 font-display text-3xl uppercase tracking-[0.1em] sm:text-4xl">
            <span className="gold-text">{tx(couple.groom.name)}</span>
            <span className="mx-3 font-script normal-case tracking-normal text-gold">&amp;</span>
            <span className="gold-text">{tx(couple.bride.name)}</span>
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-cream/70">
            {formatDate(wedding.date, lang)} · {formatTime(wedding.date, lang)}
          </p>
          {venue && <p className="mt-2 text-sm text-cream/60">{tx(venue.name)}</p>}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#wishes" className="btn-gold">
              <Heart size={15} aria-hidden="true" /> {t('sendWish')}
            </a>
            <a href={whatsappShareUrl()} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <MessageCircle size={15} aria-hidden="true" /> {t('whatsapp')}
            </a>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="btn-outline">
                <Phone size={15} aria-hidden="true" /> {t('callUs')}
              </a>
            )}
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-gold/15 px-4 pb-28 pt-12 text-center lg:pb-12">
        <Monogram a={couple.initials.groom} b={couple.initials.bride} className="mx-auto h-24 w-24 text-3xl" />
        <p className="mt-6 font-script text-3xl text-gold">{couple.hashtag}</p>
        <p className="mt-3 text-xs text-cream/50">
          {t('withLove')} — {tx(couple.groom.name)} &amp; {tx(couple.bride.name)} · {year}
        </p>
      </footer>
    </>
  );
}
