import { weddingConfig } from '../config/weddingConfig';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** Writes weddingConfig.theme into the CSS variables Tailwind reads. */
export function applyTheme() {
  const root = document.documentElement;
  for (const [name, hex] of Object.entries(weddingConfig.theme)) {
    root.style.setProperty(`--c-${name}`, hexToRgb(hex));
  }
}
