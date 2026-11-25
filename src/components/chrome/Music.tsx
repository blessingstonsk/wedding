import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { weddingConfig } from '../../config/weddingConfig';
import { useI18n } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import {
  attachMusic,
  isSoundMuted,
  onSoundMutedChange,
  playSound,
  rampMusic,
  setSoundMuted,
  unlockSound,
} from '../../lib/sound';

export interface MusicApi {
  /** Whether there is anything to switch: a music file or sound effects. */
  available: boolean;
  hasMusic: boolean;
  playing: boolean;
  muted: boolean;
  /** Call from the tap that opens the invitation (browsers require a gesture). */
  start: (introSeconds?: number) => void;
  toggle: () => void;
}

const FADE_MS = 1800;

/**
 * Background music plus the shared sound on/off switch.
 * Music fades in after the guest opens the envelope, fades out when muted,
 * and pauses while the guest is in another app or tab.
 */
export function useMusic(): MusicApi {
  const { volume } = weddingConfig.music;
  const url = asset(weddingConfig.music.url);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fade = useRef(0);
  const pauseTimer = useRef(0);
  const started = useRef(false);
  const [hasMusic, setHasMusic] = useState(Boolean(url));
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted);

  useEffect(() => onSoundMutedChange(setMuted), []);

  useEffect(() => {
    if (!url) return;
    const el = new Audio();
    el.src = url;
    el.loop = true;
    el.preload = 'none';
    el.volume = 0;
    el.addEventListener('error', () => setHasMusic(false));
    el.addEventListener('play', () => setPlaying(true));
    el.addEventListener('pause', () => setPlaying(false));
    audio.current = el;
    // Cheap existence check so the music is skipped if the file is missing.
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        if (!r.ok || !r.headers.get('content-type')?.startsWith('audio')) setHasMusic(false);
      })
      .catch(() => setHasMusic(false));
    return () => {
      cancelAnimationFrame(fade.current);
      el.pause();
      audio.current = null;
    };
  }, [url]);

  /** Fallback fade using the element's own volume (used only if the audio engine is unavailable). */
  const fadeTo = useCallback(
    (target: number, ms: number, then?: () => void) => {
      const el = audio.current;
      if (!el) return;
      cancelAnimationFrame(fade.current);
      const from = el.volume;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        el.volume = Math.max(0, Math.min(volume, from + (target - from) * k));
        if (k < 1) fade.current = requestAnimationFrame(step);
        else then?.();
      };
      fade.current = requestAnimationFrame(step);
    },
    [volume],
  );

  /**
   * Start (or resume) the music. It begins silently right away — browsers
   * require that during the tap — then rises after `delay` seconds.
   */
  const playMusic = useCallback(
    (delay = 0, riseSeconds = FADE_MS / 1000) => {
      const el = audio.current;
      if (!el || !hasMusic) return;
      const smooth = attachMusic(el);
      if (smooth) rampMusic(0, 0.05);
      else el.volume = 0;
      clearTimeout(pauseTimer.current);
      el.play()
        .then(() => {
          if (smooth) rampMusic(volume, riseSeconds, delay);
          else window.setTimeout(() => fadeTo(volume, riseSeconds * 1000), delay * 1000);
        })
        .catch(() => setPlaying(false));
    },
    [fadeTo, hasMusic, volume],
  );

  const pauseMusic = useCallback(() => {
    const el = audio.current;
    if (!el || el.paused) return;
    if (attachMusic(el)) {
      rampMusic(0, 0.9);
      pauseTimer.current = window.setTimeout(() => el.pause(), 950);
    } else {
      fadeTo(0, 900, () => el.pause());
    }
  }, [fadeTo]);

  /** `introSeconds`: how long the opening sound effect plays before the music rises. */
  const start = useCallback(
    (introSeconds = 0) => {
      started.current = true;
      unlockSound();
      if (!isSoundMuted()) playMusic(introSeconds, introSeconds ? 4 : FADE_MS / 1000);
    },
    [playMusic],
  );

  const toggle = useCallback(() => {
    unlockSound();
    const next = !isSoundMuted();
    setSoundMuted(next);
    if (next) pauseMusic();
    else {
      started.current = true;
      playMusic();
      playSound('tap');
    }
  }, [pauseMusic, playMusic]);

  // Pause while the guest is in another app/tab; resume when they return.
  useEffect(() => {
    const onVisibility = () => {
      const el = audio.current;
      if (!el || !started.current || isSoundMuted()) return;
      if (document.hidden) {
        cancelAnimationFrame(fade.current);
        el.pause();
      } else {
        playMusic();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [playMusic]);

  const available = hasMusic || weddingConfig.sounds.enabled;
  return useMemo(
    () => ({ available, hasMusic, playing, muted, start, toggle }),
    [available, hasMusic, playing, muted, start, toggle],
  );
}

export function MusicToggle({ music }: { music: MusicApi }) {
  const { t } = useI18n();
  const on = !music.muted;
  const label = on ? t('musicOff') : t('musicOn');
  return (
    <button
      type="button"
      onClick={music.toggle}
      aria-pressed={on}
      aria-label={label}
      title={music.hasMusic && music.playing ? `${weddingConfig.music.title} — ${label}` : label}
      className="fixed bottom-24 left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-wine-900/85 text-gold shadow-card backdrop-blur transition hover:border-gold md:bottom-6"
    >
      {on && music.playing ? (
        <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] origin-bottom rounded-sm bg-gold motion-safe:animate-[eq_0.9s_ease-in-out_infinite_alternate]"
              style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      ) : on ? (
        <Volume2 size={18} aria-hidden="true" />
      ) : (
        <VolumeX size={18} aria-hidden="true" />
      )}
    </button>
  );
}
