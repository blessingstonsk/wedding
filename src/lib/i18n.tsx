import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { weddingConfig, type Localized } from '../config/weddingConfig';

export type Lang = 'en' | 'ta';

/** Fixed UI labels. Wedding-specific text lives in weddingConfig. */
const ui = {
  openInvitation: { en: 'Open Invitation', ta: 'அழைப்பிதழைத் திற' },
  tapToOpen: { en: 'Tap the seal to open', ta: 'திறக்க முத்திரையைத் தட்டவும்' },
  youAreInvited: { en: 'You are cordially invited', ta: 'அன்புடன் அழைக்கிறோம்' },
  dear: { en: 'Dear', ta: 'அன்புள்ள' },
  and: { en: 'and', ta: 'மற்றும்' },
  saveTheDate: { en: 'Save the Date', ta: 'தேதியைக் குறியுங்கள்' },
  scrollToExplore: { en: 'Scroll to explore', ta: 'கீழே உருட்டவும்' },
  home: { en: 'Home', ta: 'முகப்பு' },
  story: { en: 'Story', ta: 'கதை' },
  countdown: { en: 'Countdown', ta: 'நாட்கள்' },
  events: { en: 'Events', ta: 'நிகழ்வுகள்' },
  venue: { en: 'Venue', ta: 'இடம்' },
  gallery: { en: 'Gallery', ta: 'படங்கள்' },
  wishes: { en: 'Wishes', ta: 'வாழ்த்து' },
  family: { en: 'Family', ta: 'குடும்பம்' },
  storyTitle: { en: 'Our Journey', ta: 'எங்கள் பயணம்' },
  storySub: { en: 'From our families’ blessing to a lifetime together', ta: 'குடும்பத்தாரின் ஆசியிலிருந்து வாழ்நாள் பயணம் வரை' },
  familyTitle: { en: 'With the Blessings of Our Families', ta: 'குடும்பத்தாரின் ஆசிகளுடன்' },
  groom: { en: 'The Groom', ta: 'மணமகன்' },
  bride: { en: 'The Bride', ta: 'மணமகள்' },
  countdownTitle: { en: 'Counting Down to Forever', ta: 'திருமணத்திற்கு இன்னும்' },
  days: { en: 'Days', ta: 'நாட்கள்' },
  hours: { en: 'Hours', ta: 'மணி' },
  minutes: { en: 'Minutes', ta: 'நிமிடம்' },
  seconds: { en: 'Seconds', ta: 'விநாடி' },
  marriedFor: { en: 'Happily married for', ta: 'இனிய மண வாழ்வில்' },
  weddingCalendar: { en: 'Wedding Calendar', ta: 'திருமண நாட்காட்டி' },
  calendarHint: { en: 'Tap a highlighted date to see what’s planned', ta: 'நிகழ்வுகளைக் காண தேதியைத் தட்டவும்' },
  noEventsThatDay: { en: 'No celebrations planned that day', ta: 'அன்று நிகழ்வுகள் இல்லை' },
  eventsTitle: { en: 'The Celebrations', ta: 'திருமண நிகழ்வுகள்' },
  eventsSub: { en: 'Join us for every beautiful moment', ta: 'ஒவ்வொரு அழகிய தருணத்திலும் இணையுங்கள்' },
  dressCode: { en: 'Dress code', ta: 'உடை' },
  addToCalendar: { en: 'Add to Calendar', ta: 'நாட்காட்டியில் சேர்' },
  googleCalendar: { en: 'Google Calendar', ta: 'Google நாட்காட்டி' },
  appleCalendar: { en: 'Apple / Outlook (.ics)', ta: 'Apple / Outlook (.ics)' },
  directions: { en: 'Directions', ta: 'வழி' },
  getDirections: { en: 'Get Directions', ta: 'வழியைக் காண்க' },
  venueTitle: { en: 'Where We Celebrate', ta: 'விழா நடைபெறும் இடம்' },
  venueSub: {
    en: 'We cordially invite you to join us and share your blessings',
    ta: 'வருகை தந்து ஆசீர்வதிக்க அன்புடன் அழைக்கிறோம்',
  },
  loadMap: { en: 'Show map', ta: 'வரைபடம் காட்டு' },
  galleryTitle: { en: 'Moments of Us', ta: 'எங்கள் தருணங்கள்' },
  gallerySub: { en: 'Seconds that became memories', ta: 'நினைவுகளான நொடிகள்' },
  slideshow: { en: 'Play slideshow', ta: 'ஸ்லைடுஷோ' },
  pause: { en: 'Pause', ta: 'நிறுத்து' },
  close: { en: 'Close', ta: 'மூடு' },
  previous: { en: 'Previous', ta: 'முந்தைய' },
  next: { en: 'Next', ta: 'அடுத்து' },
  yourName: { en: 'Your name', ta: 'உங்கள் பெயர்' },
  sending: { en: 'Sending…', ta: 'அனுப்புகிறது…' },
  wishesTitle: { en: 'Wishes & Blessings', ta: 'வாழ்த்துகள் & ஆசிகள்' },
  wishesSub: { en: 'Leave a few words of love for the couple', ta: 'தம்பதிக்கு அன்பான சில வார்த்தைகள்' },
  yourWish: { en: 'Your wishes', ta: 'உங்கள் வாழ்த்து' },
  sendWish: { en: 'Send Blessings', ta: 'வாழ்த்து அனுப்பு' },
  wishThanks: {
    en: 'Thank you! Your blessing will appear here once the family approves it.',
    ta: 'நன்றி! குடும்பத்தார் ஒப்புதல் அளித்ததும் உங்கள் வாழ்த்து தோன்றும்.',
  },
  wishThanksLive: { en: 'Thank you for your beautiful blessing!', ta: 'உங்கள் அழகிய வாழ்த்துக்கு நன்றி!' },
  writeAnother: { en: 'Write another', ta: 'இன்னொன்று எழுது' },
  noWishes: { en: 'Be the first to bless the couple.', ta: 'முதல் வாழ்த்தை நீங்களே அனுப்புங்கள்.' },
  wishesOff: {
    en: 'Guest wishes will open here once the family connects them.',
    ta: 'வாழ்த்துப் பகுதி விரைவில் திறக்கப்படும்.',
  },
  shareTitle: { en: 'Share the Joy', ta: 'மகிழ்ச்சியைப் பகிருங்கள்' },
  shareSub: { en: 'Send this invitation to family and friends', ta: 'இந்த அழைப்பிதழை உறவினர் நண்பர்களுக்கு அனுப்புங்கள்' },
  shareInvite: { en: 'Share', ta: 'பகிர்' },
  copyLink: { en: 'Copy Link', ta: 'இணைப்பை நகலெடு' },
  copied: { en: 'Copied!', ta: 'நகலெடுக்கப்பட்டது!' },
  whatsapp: { en: 'WhatsApp', ta: 'WhatsApp' },
  downloadCard: { en: 'Download Card', ta: 'அட்டையைப் பதிவிறக்கு' },
  printInvite: { en: 'Print', ta: 'அச்சிடு' },
  scanToOpen: { en: 'Scan to open the invitation', ta: 'அழைப்பிதழைத் திறக்க ஸ்கேன் செய்யவும்' },
  closingTitle: { en: 'We Can’t Wait to Celebrate With You', ta: 'உங்களுடன் கொண்டாட காத்திருக்கிறோம்' },
  callUs: { en: 'Call Us', ta: 'அழையுங்கள்' },
  withLove: { en: 'With love', ta: 'அன்புடன்' },
  backToTop: { en: 'Back to top', ta: 'மேலே செல்' },
  musicOn: { en: 'Turn sound on', ta: 'ஒலியை இயக்கு' },
  musicOff: { en: 'Turn sound off', ta: 'ஒலியை நிறுத்து' },
  language: { en: 'தமிழ்', ta: 'English' },
  nameInvalid: { en: 'Please enter your name (2–60 characters)', ta: 'உங்கள் பெயரை உள்ளிடவும் (2–60 எழுத்துகள்)' },
  wishInvalid: { en: 'Please write 3–500 characters', ta: '3–500 எழுத்துகள் எழுதவும்' },
  genericError: { en: 'Something went wrong. Please try again in a moment.', ta: 'ஏதோ தவறு. சிறிது நேரம் கழித்து முயற்சிக்கவும்.' },
  rateLimited: { en: 'Too many attempts — please wait a few minutes.', ta: 'அதிக முயற்சிகள் — சில நிமிடங்கள் காத்திருக்கவும்.' },
} satisfies Record<string, { en: string; ta: string }>;

export type UiKey = keyof typeof ui;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: UiKey) => string;
  tx: (value: Localized | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function localize(value: Localized | undefined, lang: Lang): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return (lang === 'ta' && value.ta) || value.en;
}

function initialLang(): Lang {
  if (!weddingConfig.languages.enabled) return 'en';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'ta' || fromUrl === 'en') return fromUrl;
    const saved = localStorage.getItem('invite-lang');
    if (saved === 'ta' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return weddingConfig.languages.default;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem('invite-lang', l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => localize(ui[key], lang),
      tx: (v) => localize(v, lang),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
