import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { GoldDivider } from './Florals';

export function Reveal({ children, delay = 0, y = 28, ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: ReactNode }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-4xl font-medium uppercase leading-tight tracking-[0.08em] text-gold-soft sm:text-5xl">
        {title}
      </h2>
      <GoldDivider className="mx-auto mt-5" />
      {sub && <p className="mt-5 text-sm leading-relaxed text-cream/75 sm:text-base">{sub}</p>}
    </Reveal>
  );
}

export function Section({
  id,
  children,
  className = '',
  label,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section id={id} aria-label={label} className={`relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 ${className}`}>
      {children}
    </section>
  );
}
