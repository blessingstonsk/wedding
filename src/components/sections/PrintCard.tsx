import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { drawInviteCard } from '../../lib/inviteCard';

/**
 * Shown only when printing: the same design as the downloadable invitation
 * card (wine background, gold frame, names, date, venue, QR), without the time.
 * It is drawn quietly in the background after the page loads, so both the
 * Print button and the browser's own Print (Ctrl+P) are ready instantly.
 */
export function PrintCard() {
  const { lang, tx } = useI18n();
  const [src, setSrc] = useState('');

  useEffect(() => {
    let cancelled = false;
    const draw = () =>
      drawInviteCard(lang, { showTime: false })
        .then((canvas) => {
          if (!cancelled) setSrc(canvas.toDataURL('image/jpeg', 0.95));
        })
        .catch(() => undefined);
    // Wait until the page has settled so this never slows the opening.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const id = idle(() => void draw());
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(id as number);
    };
  }, [lang]);

  return (
    <div className="print-only print-card" aria-hidden="true">
      {src && <img src={src} alt={tx({ en: 'Wedding invitation card', ta: 'திருமண அழைப்பிதழ் அட்டை' })} />}
    </div>
  );
}
