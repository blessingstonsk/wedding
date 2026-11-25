import { motion } from 'framer-motion';
import { weddingConfig, type Person } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { Mandala } from '../ui/Florals';
import { Reveal, Section, SectionHeading } from '../ui/Section';

function PersonCard({ person, role, delay }: { person: Person; role: string; delay: number }) {
  const { tx } = useI18n();
  return (
    <Reveal delay={delay} className="card relative flex flex-col items-center px-6 pb-8 pt-10 text-center">
      <p className="eyebrow">{role}</p>
      {person.photo && (
        <div className="group relative mt-8 h-44 w-44 sm:h-48 sm:w-48">
          <Mandala className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] text-gold/25 motion-safe:animate-[spin_70s_linear_infinite]" />
          {/* A gold light that travels around the portrait. */}
          <div
            className="absolute -inset-[5px] rounded-full motion-safe:animate-[spin_5s_linear_infinite]"
            style={{
              background:
                'conic-gradient(from 0deg, rgb(var(--c-gold) / .15) 0 50%, rgb(var(--c-gold-soft)) 78%, rgb(var(--c-gold)) 88%, rgb(var(--c-gold) / .15) 100%)',
            }}
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: delay + 0.2 }}
            className="relative h-full w-full overflow-hidden rounded-full border-4 border-wine-900 shadow-glow"
          >
            <img
              src={asset(person.photo)}
              alt={tx(person.name)}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
          </motion.div>
        </div>
      )}
      <h3 className="mt-6 font-display text-3xl uppercase tracking-[0.1em] text-gold-soft">{tx(person.name)}</h3>
      {person.subtitle && <p className="mt-1 text-sm text-cream/60">{tx(person.subtitle)}</p>}
      <p className="mt-4 font-display text-lg italic text-cream/90">{tx(person.parents)}</p>
      {person.note && <p className="mt-2 text-xs text-cream/50">{tx(person.note)}</p>}
    </Reveal>
  );
}

export function Family() {
  const { t, tx } = useI18n();
  const { couple, content } = weddingConfig;
  return (
    <Section id="family" label={t('family')}>
      <SectionHeading eyebrow={tx(content.eldersBlessing)} title={t('familyTitle')} sub={tx(content.familyMessage)} />
      <div className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        <PersonCard person={couple.groom} role={t('groom')} delay={0} />
        <Reveal delay={0.15} className="text-center font-script text-6xl text-gold">
          &amp;
        </Reveal>
        <PersonCard person={couple.bride} role={t('bride')} delay={0.3} />
      </div>
      <Reveal className="mx-auto mt-14 max-w-2xl text-center">
        <p className="font-display text-xl italic leading-relaxed text-gold-soft/90 sm:text-2xl">{tx(content.blessingQuote)}</p>
      </Reveal>
    </Section>
  );
}
