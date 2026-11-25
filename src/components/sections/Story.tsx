import { motion, useScroll } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useRef, useState } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { Section, SectionHeading } from '../ui/Section';

export function Story() {
  const { t, tx } = useI18n();
  const ref = useRef<HTMLOListElement>(null);
  const [wide] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] });

  return (
    <Section id="story" label={t('storyTitle')}>
      <SectionHeading title={t('storyTitle')} sub={t('storySub')} />
      <ol ref={ref} className="relative mx-auto max-w-5xl">
        {/* Timeline spine that fills as you scroll */}
        <div className="absolute bottom-0 left-5 top-0 w-px bg-gold/15 md:left-1/2" aria-hidden="true" />
        <motion.div
          className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-gold-soft via-gold to-gold-deep md:left-1/2"
          style={{ scaleY: scrollYProgress }}
          aria-hidden="true"
        />
        {weddingConfig.story.map((m, i) => {
          const right = i % 2 === 1;
          // Slide in from the side on wide screens; rise from below on phones so nothing sits off-screen.
          const from = wide ? { x: right ? 40 : -40 } : { y: 30 };
          return (
            <li key={i} className="relative mb-14 last:mb-0 md:grid md:grid-cols-2 md:gap-16">
              <span
                className="absolute left-5 top-6 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-gold bg-wine-900 text-gold md:left-1/2"
                aria-hidden="true"
              >
                <Heart size={14} fill="currentColor" />
              </span>
              {/* The card watches the viewport; the photo inside follows via variants. */}
              <motion.article
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                variants={{ hidden: { opacity: 0, ...from }, show: { opacity: 1, x: 0, y: 0 } }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`card group ml-12 overflow-hidden md:ml-0 ${right ? 'md:col-start-2' : 'md:col-start-1'}`}
              >
                {/* Curtain-style reveal: the photo wipes open and settles from a slight zoom. */}
                <motion.div
                  className="img-shine-hover relative overflow-hidden"
                  variants={{
                    hidden: { clipPath: 'inset(0 0 100% 0)' },
                    show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.1, delay: 0.2, ease: [0.65, 0, 0.35, 1] } },
                  }}
                >
                  <motion.img
                    src={asset(m.photo)}
                    alt={tx(m.title)}
                    loading="lazy"
                    variants={{
                      hidden: { scale: 1.25 },
                      show: { scale: 1, transition: { duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </motion.div>
                <div className="p-6">
                  {m.date && <p className="eyebrow mb-2">{tx(m.date)}</p>}
                  <h3 className="font-display text-2xl text-gold-soft">{tx(m.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cream/75">{tx(m.text)}</p>
                </div>
              </motion.article>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
