import { useEffect, useState } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target instant has passed. */
  passed: boolean;
  /** Milliseconds since the target (0 before it). */
  elapsedMs: number;
}

/**
 * Ticks once a second toward an ISO instant. Because the config stores dates
 * with an explicit +05:30 offset, the maths is exact for IST regardless of
 * the guest's own device time zone.
 */
export function useCountdown(targetIso: string): Countdown {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      // Align to the next whole second so digits flip together.
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => clearTimeout(id);
  }, []);

  const diff = target - now;
  const abs = Math.abs(diff);
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor(abs / 3_600_000) % 24,
    minutes: Math.floor(abs / 60_000) % 60,
    seconds: Math.floor(abs / 1000) % 60,
    passed: diff <= 0,
    elapsedMs: diff <= 0 ? abs : 0,
  };
}
