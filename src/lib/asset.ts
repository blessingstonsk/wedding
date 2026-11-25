/**
 * Turns a site path from weddingConfig (e.g. '/images/photos/x.jpg') into a
 * URL that works wherever the site is hosted — at the domain root (Netlify)
 * or in a sub-folder such as https://<user>.github.io/wedding/ (GitHub Pages).
 * Full URLs (https://…) and empty strings are returned unchanged.
 */
export function asset(path: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
}

/** The current path without the hosting sub-folder, e.g. '/admin'. */
export function sitePath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname;
  return (base && path.startsWith(base) ? path.slice(base.length) : path).replace(/\/$/, '') || '/';
}
