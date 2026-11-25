import { CalendarHeart, Heart, Hourglass, Images, MapPin, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n, type UiKey } from '../../lib/i18n';

const links: { id: string; key: UiKey }[] = [
  { id: 'home', key: 'home' },
  { id: 'family', key: 'family' },
  { id: 'story', key: 'story' },
  { id: 'countdown', key: 'countdown' },
  { id: 'events', key: 'events' },
  { id: 'venue', key: 'venue' },
  { id: 'gallery', key: 'gallery' },
  { id: 'wishes', key: 'wishes' },
];

/** The five quick tabs from the reference design, pinned to the bottom on phones. */
const tabs: { id: string; key: UiKey; Icon: typeof Hourglass }[] = [
  { id: 'countdown', key: 'countdown', Icon: Hourglass },
  { id: 'events', key: 'events', Icon: CalendarHeart },
  { id: 'gallery', key: 'gallery', Icon: Images },
  { id: 'venue', key: 'venue', Icon: MapPin },
  { id: 'wishes', key: 'wishes', Icon: Heart },
];

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const ids = links.map((l) => l.id);

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const active = useActiveSection(ids);
  const [scrolled, setScrolled] = useState(false);
  const { initials } = weddingConfig.couple;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const langToggle = weddingConfig.languages.enabled && (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gold/40 px-3 text-xs text-gold-soft transition hover:border-gold hover:bg-gold/10"
      aria-label={lang === 'en' ? 'தமிழில் காண்க' : 'View in English'}
    >
      <Languages size={14} aria-hidden="true" />
      {t('language')}
    </button>
  );

  return (
    <>
      {/* Top bar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'border-b border-gold/15 bg-wine-950/85 py-2 shadow-card backdrop-blur-md' : 'bg-gradient-to-b from-wine-950/80 to-transparent py-4'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
          <a href="#home" className="font-display text-2xl tracking-wide text-gold-soft" aria-label="Home">
            {initials.groom}
            <span className="mx-0.5 font-script text-xl text-gold">&amp;</span>
            {initials.bride}
          </a>
          <ul className="hidden items-center gap-1 lg:flex">
            {links.slice(1).map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  aria-current={active === l.id ? 'true' : undefined}
                  className={`relative rounded px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] transition ${
                    active === l.id ? 'text-gold' : 'text-cream/70 hover:text-gold-soft'
                  }`}
                >
                  {t(l.key)}
                  {active === l.id && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gold" />}
                </a>
              </li>
            ))}
          </ul>
          {langToggle}
        </nav>
      </header>

      {/* Bottom tab bar (phones & tablets) */}
      <nav
        aria-label="Quick links"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/20 bg-wine-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map(({ id, key, Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? 'true' : undefined}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] transition ${
                  active === id ? 'text-gold' : 'text-cream/65'
                }`}
              >
                <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
                {t(key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
