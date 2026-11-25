/**
 * Sound for the invitation: soft effects synthesised with the Web Audio API
 * (no audio files to download), the background music's volume control, and
 * one shared on/off switch for both.
 *
 * Browsers only allow sound after the guest interacts with the page, so
 * `unlockSound()` must be called from a tap/click handler (opening the
 * envelope does this).
 */
import { weddingConfig } from '../config/weddingConfig';
import { asset } from './asset';

export type SoundEffect = 'cinematic' | 'seal' | 'whoosh' | 'chime' | 'sparkle' | 'swish' | 'tap' | 'thankyou';

/**
 * Notes in B♭ major — the key of "A Thousand Years" — so the opening chimes
 * and swell flow naturally into the music.
 */
const KEY = {
  bass: 58.27, // B♭1
  pad: [116.54, 174.61, 233.08, 293.66, 349.23], // B♭2 F3 B♭3 D4 F4
  chimes: [466.16, 587.33, 698.46, 932.33, 1174.66, 1396.91, 1864.66], // B♭4 … B♭6
};

/** Seconds from the seal tap until the music starts to rise (matches the page reveal). */
export const INTRO_SECONDS = 1.9;

const MUTED_KEY = 'invite-sound-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null; // sound effects
let reverb: GainNode | null = null; // send into the reverb
let noise: AudioBuffer | null = null;
let musicGain: GainNode | null = null;
let musicEl: HTMLMediaElement | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

function readMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export const isSoundMuted = () => muted;

export function setSoundMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(value));
}

export function onSoundMutedChange(fn: (muted: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** A soft, wide hall: decaying stereo noise used as a reverb impulse. */
function makeImpulse(c: AudioContext, seconds: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

/** Create/resume the audio engine. Call inside a user gesture. */
export function unlockSound() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = weddingConfig.sounds.volume;
      master.connect(ctx.destination);

      const convolver = ctx.createConvolver();
      convolver.buffer = makeImpulse(ctx, 3.2);
      const wet = ctx.createGain();
      wet.gain.value = 0.55;
      reverb = ctx.createGain();
      reverb.connect(convolver).connect(wet).connect(master);

      // One second of white noise, reused for whoosh/swish/seal textures.
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/* ── Music ─────────────────────────────────────────────────────────────── */

/**
 * Routes the music through the audio engine so its volume can be faded
 * smoothly on every phone (iPhones ignore the normal volume setting).
 * Returns false if that isn't possible; callers then fall back to `el.volume`.
 */
export function attachMusic(el: HTMLMediaElement) {
  if (!ctx) return false;
  if (musicEl === el && musicGain) return true;
  try {
    const src = ctx.createMediaElementSource(el);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    src.connect(musicGain).connect(ctx.destination);
    musicEl = el;
    el.volume = 1;
    return true;
  } catch {
    return false;
  }
}

/** The music level most recently faded to (restored after a dip). */
let musicLevel = 0;

/**
 * Briefly soften the music (e.g. while the thank-you plays), then bring it
 * back to where it was after `seconds`.
 */
export function dipMusic(seconds: number, to = 0.3) {
  if (!ctx || !musicGain || musicLevel <= 0) return;
  const g = musicGain.gain;
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.setTargetAtTime(musicLevel * to, now, 0.15);
  g.setTargetAtTime(musicLevel, now + seconds, 0.6);
}

/** Fade the music to `target` over `seconds`, optionally after `delay` seconds. */
export function rampMusic(target: number, seconds: number, delay = 0) {
  if (!ctx || !musicGain) return;
  musicLevel = target;
  const g = musicGain.gain;
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.setValueAtTime(g.value, now + delay);
  // A gentle S-curve feels more natural than a straight line.
  const steps = 24;
  const from = g.value;
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const k = i / (steps - 1);
    curve[i] = from + (target - from) * (0.5 - 0.5 * Math.cos(Math.PI * k));
  }
  g.setValueCurveAtTime(curve, now + delay + 0.001, Math.max(0.05, seconds));
}

/* ── Building blocks ──────────────────────────────────────────────────── */

/** Send a node to both the dry output and the reverb. */
function out(node: AudioNode, wet = 0.4) {
  node.connect(master!);
  if (reverb && wet > 0) {
    const send = ctx!.createGain();
    send.gain.value = wet;
    node.connect(send).connect(reverb);
  }
}

/** A single bell-like note with a soft attack and long, gentle decay. */
function bell(freq: number, at: number, length: number, level: number, wet = 0.45) {
  if (!ctx || !master) return;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(level, at + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  out(env, wet);
  // Fundamental plus quieter overtones give a warm, glassy tone.
  [
    [1, 1],
    [2.76, 0.25],
    [5.4, 0.08],
  ].forEach(([ratio, amp]) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    g.gain.value = amp;
    osc.connect(g).connect(env);
    osc.start(at);
    osc.stop(at + length + 0.05);
  });
}

/** Filtered noise sweep — paper, fabric and air sounds. */
function sweep(at: number, length: number, from: number, to: number, level: number, q = 0.9, wet = 0) {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + length);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + length * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(filter).connect(g);
  out(g, wet);
  src.start(at, Math.random() * 0.5);
  src.stop(at + length + 0.05);
}

/** A swelling string-like chord: detuned saws through an opening filter. */
function pad(at: number, rise: number, hold: number, release: number, level: number) {
  if (!ctx || !master) return;
  const end = at + rise + hold + release;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(250, at);
  filter.frequency.exponentialRampToValueAtTime(2600, at + rise);
  filter.frequency.exponentialRampToValueAtTime(900, end);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + rise);
  env.gain.setValueAtTime(level, at + rise + hold);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  filter.connect(env);
  out(env, 0.7);
  KEY.pad.forEach((f) => {
    [-7, 7].forEach((cents) => {
      const osc = ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = cents;
      const g = ctx!.createGain();
      g.gain.value = 0.12;
      osc.connect(g).connect(filter);
      osc.start(at);
      osc.stop(end + 0.05);
    });
  });
}

/** Rising air — the classic cinematic "riser" that builds tension. */
function riser(at: number, length: number, level: number) {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(200, at);
  filter.frequency.exponentialRampToValueAtTime(7000, at + length);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + length * 0.95);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.25);
  src.connect(filter).connect(g);
  out(g, 0.5);
  src.start(at);
  src.stop(at + length + 0.3);
}

/** A deep, soft "bloom" — the cinematic impact as the page opens. */
function boom(at: number, level: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(KEY.bass * 1.6, at);
  osc.frequency.exponentialRampToValueAtTime(KEY.bass, at + 0.35);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(level, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 2.2);
  osc.connect(g);
  out(g, 0.35);
  osc.start(at);
  osc.stop(at + 2.3);
  // A soft air hit on top of the low tone.
  sweep(at, 0.5, 900, 180, 0.35, 0.6, 0.6);
}

/* ── Effects ──────────────────────────────────────────────────────────── */

export function playSound(effect: SoundEffect) {
  if (muted || !weddingConfig.sounds.enabled || !ctx || !master) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime + 0.01;
  const c = KEY.chimes;

  switch (effect) {
    case 'cinematic': {
      // The envelope opening, timed to the animation (about 2 seconds):
      // seal cracks → swell rises as the flap lifts → chimes as the card rises
      // → a soft bloom as the page appears, where the music takes over.
      playSound('seal');
      pad(t + 0.05, INTRO_SECONDS - 0.05, 0.6, 3.2, 0.16);
      riser(t + 0.1, INTRO_SECONDS - 0.15, 0.32);
      sweep(t + 0.25, 0.7, 300, 2600, 0.35); // flap
      [c[0], c[1], c[2], c[3], c[4], c[5]].forEach((f, i) => bell(f, t + 0.8 + i * 0.12, 2.8, 0.2));
      // Descending sparkle cascade.
      [c[6], c[5], c[4], c[5], c[6]].forEach((f, i) => bell(f * 2, t + 1.25 + i * 0.07, 0.9, 0.05, 0.6));
      boom(t + INTRO_SECONDS, 0.75);
      // A final shimmering chord that rings into the music.
      [c[0], c[2], c[3], c[4]].forEach((f) => bell(f, t + INTRO_SECONDS + 0.02, 4.5, 0.11, 0.8));
      break;
    }
    case 'seal': {
      // The wax seal cracking: a crisp snap over a soft, low thump.
      sweep(t, 0.07, 3200, 1800, 0.9, 1.4);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
    }
    case 'whoosh':
      sweep(t, 0.7, 300, 2600, 0.5);
      break;
    case 'chime':
      // A rising wedding-bell arpeggio.
      [c[0], c[1], c[2], c[3]].forEach((f, i) => bell(f, t + i * 0.13, 2.4, 0.26));
      break;
    case 'sparkle':
      // Tiny high twinkles, e.g. when petals burst.
      [c[4], c[5], c[6], c[5], c[6]].forEach((f, i) => bell(f * 2, t + i * 0.07 + Math.random() * 0.03, 0.6, 0.05, 0.6));
      break;
    case 'swish':
      // Soft page-turn for the gallery.
      sweep(t, 0.28, 1800, 700, 0.25, 0.7);
      break;
    case 'tap':
      bell(c[3], t, 0.3, 0.1, 0.2);
      break;
    case 'thankyou': {
      // A warm "thank you": a harp-like rise that settles on a glowing chord.
      dipMusic(3.2);
      const harp = [c[0] / 2, KEY.pad[3], c[0], c[1], c[2], c[3]];
      harp.forEach((f, i) => bell(f, t + i * 0.09, 2.2, 0.16, 0.6));
      // Two gentle "thank-you" notes (D → B♭), like a sung phrase.
      bell(c[4], t + 0.75, 1.6, 0.2, 0.55);
      bell(c[3], t + 1.15, 3.2, 0.22, 0.7);
      // Resolving chord underneath, plus a soft sparkle on top.
      [c[0], c[1], c[2]].forEach((f) => bell(f, t + 1.15, 3.4, 0.09, 0.8));
      [c[6], c[5], c[6]].forEach((f, i) => bell(f * 2, t + 1.35 + i * 0.08, 0.8, 0.04, 0.6));
      break;
    }
  }
}

/* ── Thank-you after a blessing is sent ───────────────────────────────── */

let thankYouBuffer: Promise<AudioBuffer | null> | null = null;

/** Load (once) the optional recorded thank-you message from config. */
function loadThankYou() {
  const url = asset(weddingConfig.sounds.thankYouUrl);
  if (!ctx || !url) return Promise.resolve(null);
  thankYouBuffer ??= fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))))
    .then((data) => ctx!.decodeAudioData(data))
    .catch(() => null);
  return thankYouBuffer;
}

/**
 * Plays the couple's recorded thank-you if one is set in config
 * (`sounds.thankYouUrl`), otherwise the "thank you" melody. The music
 * softens while it plays.
 */
export async function playThankYou() {
  if (muted || !ctx) return;
  const buffer = await loadThankYou();
  if (!buffer || !ctx) {
    playSound('thankyou');
    return;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = 0.95;
  src.connect(g).connect(ctx.destination);
  dipMusic(buffer.duration + 0.3, 0.2);
  src.start();
  // A little sparkle as the message begins.
  playSound('sparkle');
}
