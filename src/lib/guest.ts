/**
 * Personalised greeting from ?guest=Name (or ?to=Name).
 * The value is never stored or sent anywhere: it is reduced to letters,
 * spaces and a little punctuation, capped in length, and rendered as text.
 */
export function readGuestName(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('guest') ?? params.get('to');
    if (!raw) return null;
    const cleaned = raw
      .normalize('NFC')
      .replace(/[^\p{L}\p{M}\s.'&-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    return cleaned.length >= 2 ? cleaned : null;
  } catch {
    return null;
  }
}
