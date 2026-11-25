import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { LoadingScreen } from './components/chrome/LoadingScreen';
import { Envelope } from './components/chrome/Envelope';
import { Navbar } from './components/chrome/Navbar';
import { ScrollProgress, BackToTop } from './components/chrome/ScrollAids';
import { MusicToggle, useMusic } from './components/chrome/Music';
import { Petals, burstPetals } from './components/ui/Petals';
import { Hero } from './components/sections/Hero';
import { Family } from './components/sections/Family';
import { Story } from './components/sections/Story';
import { CountdownSection } from './components/sections/Countdown';
import { Events } from './components/sections/Events';
import { VenueSection } from './components/sections/Venue';
import { Gallery } from './components/sections/Gallery';
import { Wishes } from './components/sections/Wishes';
import { Share } from './components/sections/Share';
import { Closing } from './components/sections/Closing';
import { PrintCard } from './components/sections/PrintCard';
import { sitePath } from './lib/asset';
import { readGuestName } from './lib/guest';
import { INTRO_SECONDS, playSound } from './lib/sound';
import { useI18n } from './lib/i18n';

const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

const OPENED_KEY = 'invite-opened';

function wasOpened() {
  try {
    return sessionStorage.getItem(OPENED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const { lang } = useI18n();
  const isAdmin = sitePath() === '/admin';
  const [loading, setLoading] = useState(!isAdmin);
  const [opened, setOpened] = useState(wasOpened);
  const [guest] = useState(readGuestName);
  const music = useMusic();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Loading screen: wait for web fonts (so names don't reflow) with a short minimum.
  useEffect(() => {
    if (isAdmin) return;
    const min = new Promise((r) => setTimeout(r, 900));
    const fonts = (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined);
    const cap = new Promise((r) => setTimeout(r, 3500));
    Promise.race([Promise.all([min, fonts]), cap]).then(() => setLoading(false));
  }, [isAdmin]);

  // Lock scroll while the envelope is showing.
  useEffect(() => {
    document.body.style.overflow = opened || isAdmin ? '' : 'hidden';
  }, [opened, isAdmin]);

  const handleOpen = useCallback(() => {
    setOpened(true);
    try {
      sessionStorage.setItem(OPENED_KEY, '1');
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
    setTimeout(() => {
      burstPetals(50);
      playSound('sparkle');
    }, 250);
  }, []);

  // A guest who reloads skips the envelope, so start sound on their first tap instead.
  const { start: startSound } = music;
  useEffect(() => {
    if (!wasOpened() || isAdmin) return;
    const onFirstTap = () => startSound();
    window.addEventListener('pointerdown', onFirstTap, { once: true });
    return () => window.removeEventListener('pointerdown', onFirstTap);
  }, [startSound, isAdmin]);

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-gold">Loading…</div>}>
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{loading && <LoadingScreen key="loader" />}</AnimatePresence>
      <AnimatePresence>{!loading && !opened && <Envelope key="envelope" guest={guest} onStart={() => music.start(INTRO_SECONDS)} onOpen={handleOpen} />}</AnimatePresence>

      <div className="no-print">
        {opened && <Petals />}
        <ScrollProgress />
        <Navbar />
        <main>
          <Hero guest={guest} ready={opened} />
          <Family />
          <Story />
          <CountdownSection />
          <Events />
          <VenueSection />
          <Gallery />
          <Wishes />
          <Share />
          <Closing />
        </main>
        <BackToTop />
        {music.available && <MusicToggle music={music} />}
      </div>
      <PrintCard />
    </MotionConfig>
  );
}
