import { useId, type CSSProperties } from 'react';

/**
 * Hand-built SVG florals (no image downloads): layered roses, buds and gilded
 * leaves arranged into corner clusters, dividers and a monogram frame.
 */

type Tone = 'wine' | 'cream' | 'blush';

const tones: Record<Tone, { outer: string; mid: string; inner: string; edge: string }> = {
  wine: { outer: '#7A1626', mid: '#93202F', inner: '#5A0E1A', edge: '#3E0811' },
  cream: { outer: '#F1DFC6', mid: '#F8EBDA', inner: '#DCC2A0', edge: '#B89A74' },
  blush: { outer: '#E4AE9E', mid: '#F0C6B8', inner: '#C98673', edge: '#A0624F' },
};

function Rose({ x, y, r, tone, rot = 0 }: { x: number; y: number; r: number; tone: Tone; rot?: number }) {
  const c = tones[tone];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse
          key={`o${i}`}
          rx={r * 0.62}
          ry={r * 0.46}
          transform={`rotate(${i * (360 / 7)}) translate(${r * 0.44} 0)`}
          fill={c.outer}
          stroke={c.edge}
          strokeWidth={r * 0.03}
          strokeOpacity={0.55}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse
          key={`m${i}`}
          rx={r * 0.42}
          ry={r * 0.32}
          transform={`rotate(${i * 72 + 30}) translate(${r * 0.24} 0)`}
          fill={c.mid}
          stroke={c.edge}
          strokeWidth={r * 0.03}
          strokeOpacity={0.5}
        />
      ))}
      <circle r={r * 0.3} fill={c.inner} />
      <path
        d={`M0 0 a${r * 0.08} ${r * 0.08} 0 1 1 ${r * 0.16} 0 a${r * 0.16} ${r * 0.16} 0 1 1 ${-r * 0.32} 0 a${r * 0.24} ${r * 0.24} 0 1 1 ${r * 0.46} 0`}
        fill="none"
        stroke={c.edge}
        strokeWidth={r * 0.035}
        strokeLinecap="round"
        opacity={0.8}
      />
    </g>
  );
}

function Leaf({ x, y, len, rot, fill }: { x: number; y: number; len: number; rot: number; fill: string }) {
  const w = len * 0.28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 C ${len * 0.3} ${-w} ${len * 0.75} ${-w} ${len} 0 C ${len * 0.75} ${w} ${len * 0.3} ${w} 0 0Z`} fill={fill} />
      <path d={`M0 0 L ${len * 0.92} 0`} stroke="rgba(60,20,10,.35)" strokeWidth={len * 0.025} />
    </g>
  );
}

function Bud({ x, y, r, tone }: { x: number; y: number; r: number; tone: Tone }) {
  const c = tones[tone];
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={r * 0.7} ry={r} fill={c.outer} stroke={c.edge} strokeOpacity={0.5} strokeWidth={r * 0.06} />
      <path d={`M${-r * 0.7} ${r * 0.2} Q 0 ${r * 1.6} ${r * 0.7} ${r * 0.2}`} fill="#5E6B3A" opacity={0.85} />
    </g>
  );
}

/** A lush corner cluster. Mirror with `flip` for the opposite corner. */
export function FloralCorner({
  className = '',
  style,
  flip = false,
}: {
  className?: string;
  style?: CSSProperties;
  flip?: 'x' | 'y' | 'xy' | false;
}) {
  const id = useId().replace(/:/g, '');
  const sx = flip === 'x' || flip === 'xy' ? -1 : 1;
  const sy = flip === 'y' || flip === 'xy' ? -1 : 1;
  return (
    <svg
      viewBox="0 0 320 320"
      className={`pointer-events-none select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F3DCA4" />
          <stop offset="0.55" stopColor="#C99A4E" />
          <stop offset="1" stopColor="#8E6526" />
        </linearGradient>
        <linearGradient id={`l${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#6F7A45" />
          <stop offset="1" stopColor="#A8A86A" />
        </linearGradient>
      </defs>
      {/* Flip inside the SVG so CSS animations on the element can't override it. */}
      <g transform={`translate(${sx < 0 ? 320 : 0} ${sy < 0 ? 320 : 0}) scale(${sx} ${sy})`}>
      {/* stems */}
      <g fill="none" stroke={`url(#g${id})`} strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <path d="M20 40 C 90 70, 150 90, 250 70" />
        <path d="M40 20 C 70 90, 90 150, 70 250" />
        <path d="M60 60 C 120 120, 170 150, 230 200" />
      </g>
      {/* gilded leaves */}
      <Leaf x={150} y={85} len={46} rot={-20} fill={`url(#g${id})`} />
      <Leaf x={205} y={78} len={40} rot={15} fill={`url(#g${id})`} />
      <Leaf x={86} y={150} len={44} rot={110} fill={`url(#g${id})`} />
      <Leaf x={80} y={205} len={38} rot={70} fill={`url(#g${id})`} />
      <Leaf x={165} y={150} len={40} rot={40} fill={`url(#l${id})`} />
      <Leaf x={120} y={60} len={36} rot={-60} fill={`url(#l${id})`} />
      <Leaf x={58} y={118} len={36} rot={150} fill={`url(#l${id})`} />
      <Leaf x={210} y={190} len={30} rot={30} fill={`url(#g${id})`} />
      {/* roses */}
      <Rose x={62} y={62} r={58} tone="wine" rot={10} />
      <Rose x={150} y={42} r={34} tone="cream" rot={40} />
      <Rose x={40} y={160} r={32} tone="blush" rot={-20} />
      <Rose x={128} y={118} r={26} tone="cream" rot={70} />
      <Rose x={240} y={60} r={18} tone="blush" rot={0} />
      <Bud x={262} y={86} r={8} tone="wine" />
      <Bud x={70} y={250} r={8} tone="blush" />
      <Bud x={225} y={205} r={7} tone="cream" />
      {/* gold berries */}
      {[
        [200, 110],
        [190, 120],
        [110, 200],
        [118, 214],
        [272, 66],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3} fill={`url(#g${id})`} />
      ))}
      </g>
    </svg>
  );
}

/** Thin gold line with a central lotus-bud motif — matches the reference divider. */
export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 20" className={`h-4 w-44 text-gold ${className}`} aria-hidden="true">
      <path d="M2 10 H88 M132 10 H218" stroke="currentColor" strokeWidth="1" />
      <path d="M88 10 q8 -7 16 0 q-8 7 -16 0Z M132 10 q-8 -7 -16 0 q8 7 16 0Z" fill="currentColor" opacity="0.8" />
      <path d="M110 2 C114 7 114 13 110 18 C106 13 106 7 110 2Z" fill="currentColor" />
      <circle cx="98" cy="10" r="1.6" fill="currentColor" />
      <circle cx="122" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Kolam-inspired circular ornament used behind the monogram and countdown. */
export function Mandala({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.7">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="88" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="60" />
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d="M100 12 C112 30 112 44 100 60 C88 44 88 30 100 12Z" transform={`rotate(${i * 22.5} 100 100)`} />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={`d${i}`} cx="100" cy="70" r="2" transform={`rotate(${i * 15} 100 100)`} />
        ))}
      </g>
    </svg>
  );
}

/** Gold monogram with the couple's initials. */
export function Monogram({ a, b, className = '' }: { a: string; b: string; className?: string }) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <Mandala className="absolute inset-0 h-full w-full text-gold/40 motion-safe:animate-[spin_80s_linear_infinite]" />
      <span className="relative font-display text-[1em] font-medium leading-none tracking-wide text-gold-soft">
        {a}
        <span className="mx-[0.12em] font-script text-[0.7em] text-gold">&amp;</span>
        {b}
      </span>
    </div>
  );
}
