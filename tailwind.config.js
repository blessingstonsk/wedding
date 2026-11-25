/** @type {import('tailwindcss').Config} */
// Colours come from CSS variables set at runtime from weddingConfig.theme,
// so changing the config re-themes the whole site.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          950: token('wine-950'),
          900: token('wine-900'),
          800: token('wine-800'),
          700: token('wine-700'),
          600: token('wine-600'),
        },
        gold: { DEFAULT: token('gold'), soft: token('gold-soft'), deep: token('gold-deep') },
        cream: token('cream'),
        blush: token('blush'),
        rose: token('rose'),
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Noto Serif Tamil"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', '"Noto Serif Tamil"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        sans: ['Poppins', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -28px rgb(0 0 0 / 0.65)',
        glow: '0 0 0 1px rgb(var(--c-gold) / 0.35), 0 18px 40px -20px rgb(var(--c-gold) / 0.35)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        sway: { '0%,100%': { transform: 'rotate(-1.5deg)' }, '50%': { transform: 'rotate(1.5deg)' } },
        glow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgb(var(--c-gold) / 0)', opacity: '0.6' },
          '50%': { boxShadow: '0 0 28px 2px rgb(var(--c-gold) / 0.35)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 6s linear infinite',
        float: 'float 6s ease-in-out infinite',
        sway: 'sway 9s ease-in-out infinite',
        glow: 'glow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
