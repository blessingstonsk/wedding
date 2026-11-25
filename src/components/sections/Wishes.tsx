import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Loader2, Quote } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { weddingConfig } from '../../config/weddingConfig';
import { ApiError, backendEnabled, deviceId, fetchWishes, submitWish, type Wish } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { formatDate } from '../../lib/time';
import { playThankYou, unlockSound } from '../../lib/sound';
import { burstPetals } from '../ui/Petals';
import { Reveal, Section, SectionHeading } from '../ui/Section';

function HeartBloom() {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-gold"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((i / 8) * Math.PI * 2) * 46,
            y: Math.sin((i / 8) * Math.PI * 2) * 46,
            opacity: 0,
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      ))}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-rose"
      >
        <Heart size={56} fill="currentColor" strokeWidth={1} className="text-rose drop-shadow-[0_0_18px_rgba(178,58,72,.7)]" />
      </motion.div>
    </div>
  );
}

export function Wishes() {
  const { t, lang } = useI18n();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [approved, setApproved] = useState(false);
  const live = backendEnabled && weddingConfig.wishes.enabled;

  useEffect(() => {
    if (!live) return;
    fetchWishes()
      .then((r) => setWishes(r.wishes))
      .catch(() => undefined);
  }, [live]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    unlockSound(); // the tap on Send allows sound, even if the envelope was skipped
    const n = name.trim();
    const m = message.trim();
    if (n.length < 2 || n.length > 60) return setError(t('nameInvalid'));
    if (m.length < 3 || m.length > 500) return setError(t('wishInvalid'));
    setError('');
    setStatus('sending');
    try {
      const res = await submitWish({ name: n, message: m, deviceId: deviceId(), website: honeypot });
      setApproved(res.approved);
      if (res.approved) {
        setWishes((w) => [{ id: crypto.randomUUID(), name: n, message: m, created_at: new Date().toISOString() }, ...w]);
      }
      setStatus('done');
      setMessage('');
      burstPetals(30);
      void playThankYou();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? t('rateLimited') : t('genericError'));
      setStatus('idle');
    }
  };

  if (!weddingConfig.wishes.enabled) return null;

  return (
    <Section id="wishes" label={t('wishesTitle')}>
      <SectionHeading title={t('wishesTitle')} sub={t('wishesSub')} />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="card h-fit p-6 sm:p-8">
          {!live ? (
            <p className="text-center text-sm leading-relaxed text-cream/70">{t('wishesOff')}</p>
          ) : (
            <AnimatePresence mode="wait">
              {status === 'done' ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center" role="status">
                  <HeartBloom />
                  <p className="mt-4 text-cream/85">{approved ? t('wishThanksLive') : t('wishThanks')}</p>
                  <button type="button" className="btn-outline mt-6" onClick={() => setStatus('idle')}>
                    {t('writeAnother')}
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div>
                    <label htmlFor="wish-name" className="label">
                      {t('yourName')}
                    </label>
                    <input id="wish-name" className="field" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="wish-msg" className="label">
                      {t('yourWish')}
                    </label>
                    <textarea id="wish-msg" className="field min-h-[130px] resize-y" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
                    <p className="mt-1 text-right text-[0.65rem] text-cream/40">{message.length}/500</p>
                  </div>
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                  </div>
                  {error && (
                    <p className="text-sm text-blush" role="alert">
                      {error}
                    </p>
                  )}
                  <button type="submit" className="btn-gold w-full" disabled={status === 'sending'}>
                    {status === 'sending' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Heart size={15} aria-hidden="true" />}
                    {status === 'sending' ? t('sending') : t('sendWish')}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </Reveal>

        <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1 [scrollbar-color:rgb(var(--c-gold)/.4)_transparent]">
          {wishes.length === 0 ? (
            <Reveal className="grid h-full min-h-[200px] place-items-center rounded-2xl border border-dashed border-gold/25 p-8 text-center">
              <p className="font-display text-xl italic text-cream/60">{t('noWishes')}</p>
            </Reveal>
          ) : (
            wishes.map((w, i) => (
              <motion.figure
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 5) * 0.05 }}
                className="card p-5"
              >
                <Quote size={18} className="text-gold/60" aria-hidden="true" />
                <blockquote className="mt-2 whitespace-pre-line font-display text-lg leading-relaxed text-cream/90">{w.message}</blockquote>
                <figcaption className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gold-soft">— {w.name}</span>
                  <span className="text-cream/40">{formatDate(w.created_at, lang, { weekday: undefined })}</span>
                </figcaption>
              </motion.figure>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}
