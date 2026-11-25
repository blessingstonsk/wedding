import { useEffect, useRef } from 'react';

/**
 * Lightweight canvas petal layer. A gentle ambient drift plus on-demand
 * bursts (call `burstPetals()`), paused when the tab is hidden and disabled
 * entirely for prefers-reduced-motion. Kept small for budget Android phones.
 */

const BURST_EVENT = 'invite:petal-burst';

export function burstPetals(count = 40) {
  window.dispatchEvent(new CustomEvent(BURST_EVENT, { detail: count }));
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  sway: number;
  life: number;
}

const COLORS = ['#E4AE9E', '#F0C6B8', '#B23A48', '#F6EBDD', '#D4AF6A'];

export function Petals({ ambient = 14 }: { ambient?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const make = (burst: boolean): Petal => ({
      x: burst ? w / 2 + (Math.random() - 0.5) * w * 0.3 : Math.random() * w,
      y: burst ? h * 0.45 : -20 - Math.random() * h,
      vx: burst ? (Math.random() - 0.5) * 7 : (Math.random() - 0.5) * 0.4,
      vy: burst ? -Math.random() * 7 - 2 : Math.random() * 0.6 + 0.5,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.05,
      size: Math.random() * 6 + 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      sway: Math.random() * Math.PI * 2,
      life: burst ? 1 : Infinity,
    });

    const petals: Petal[] = Array.from({ length: w < 640 ? Math.round(ambient * 0.6) : ambient }, () => make(false));

    const onBurst = (e: Event) => {
      const n = Math.min((e as CustomEvent<number>).detail ?? 40, 80);
      for (let i = 0; i < n; i++) petals.push(make(true));
      if (!raf) loop();
    };

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.sway += 0.02;
        p.x += p.vx + Math.sin(p.sway) * 0.5;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.life !== Infinity) {
          p.vy += 0.12;
          p.vx *= 0.99;
          p.life -= 0.006;
          if (p.life <= 0 || p.y > h + 30) {
            petals.splice(i, 1);
            continue;
          }
        } else if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.globalAlpha = p.life === Infinity ? 0.55 : Math.min(1, p.life * 1.4);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.7, p.size * 0.6, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.6, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
        ctx.fill();
        ctx.restore();
      }
      raf = document.hidden ? 0 : requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (!document.hidden && !raf) loop();
    };

    loop();
    window.addEventListener('resize', resize);
    window.addEventListener(BURST_EVENT, onBurst);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener(BURST_EVENT, onBurst);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ambient]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden="true" />;
}
