/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WEDDING CONFIGURATION — the only file you need to edit.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every name, date, venue, photo and message on the site comes from here.
 *  Anything wrapped in [square brackets] is a PLACEHOLDER — replace it with the
 *  real details. Text fields accept either a plain string or { en, ta } for the
 *  bilingual English / Tamil toggle (Tamil falls back to English when omitted).
 *
 *  Dates: write them as ISO strings WITH the +05:30 offset (Indian Standard
 *  Time), e.g. '2027-01-20T10:00:00+05:30'. The countdown, calendar links and
 *  date formatting all use the `timeZone` below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Localized = string | { en: string; ta?: string };

export interface Person {
  name: Localized;
  /** Shown under the name, e.g. "B.E., Software Engineer" */
  subtitle?: Localized;
  parents: Localized;
  /** Optional: grandparents, native place, etc. */
  note?: Localized;
  photo?: string;
}

export type EventKind = 'ceremony' | 'reception' | 'other';

export interface WeddingEvent {
  id: string;
  kind: EventKind;
  /** Set to false to hide an event without deleting it. */
  enabled: boolean;
  name: Localized;
  start: string;
  /** Leave out to show the start time as "… onwards". */
  end?: string;
  venueName: Localized;
  address: Localized;
  /** Anything Google Maps understands: a place name, address or "lat,lng". */
  mapsQuery: string;
  /** Optional exact Google Maps link (Share → Copy link); used for Directions. */
  mapsUrl?: string;
  dressCode?: Localized;
  description?: Localized;
}

export interface Venue {
  id: string;
  label: Localized;
  name: Localized;
  address: Localized;
  mapsQuery: string;
  /** Optional exact Google Maps link (Share → Copy link); used for Directions. */
  mapsUrl?: string;
  /** Optional embed URL from Google Maps → Share → Embed a map → copy the src. */
  mapEmbedUrl?: string;
  photo: string;
  /** Which part of the photo stays in view in the card (CSS object-position). */
  photoPosition?: string;
  eventIds: string[];
}

export interface StoryMilestone {
  title: Localized;
  /** Optional — leave out to show no date on the card. */
  date?: Localized;
  text: Localized;
  photo: string;
}

export interface GalleryPhoto {
  src: string;
  caption: Localized;
  /** width / height — used to reserve space before the image loads. */
  ratio: number;
}

export const weddingConfig = {
  /** Public URL after deployment — used for share links, QR code and Open Graph. */
  siteUrl: 'https://blessingstonsk.github.io/wedding',

  couple: {
    groom: {
      name: { en: 'Andrew', ta: 'ஆண்ட்ரூ' },
      subtitle: {
        en: 'Managing Director, Rolf Harr Automats, CH-58',
        ta: 'நிர்வாக இயக்குநர், Rolf Harr Automats, CH-58',
      },
      parents: {
        en: 'Son of Mr. S. Athmanesan & Mrs. Brindha Athmanesan',
        ta: 'திரு. S. ஆத்மநேசன் – திருமதி. பிருந்தா ஆத்மநேசன் அவர்களின் மகன்',
      },
      photo: '/images/photos/groom.jpg',
    } satisfies Person,
    bride: {
      name: { en: 'Sharon', ta: 'ஷரோன்' },
      subtitle: {
        en: 'Junior Training Officer, Department of Training and Employment, Tamil Nadu',
        ta: 'இளநிலை பயிற்சி அலுவலர், பயிற்சி மற்றும் வேலைவாய்ப்புத் துறை, தமிழ்நாடு',
      },
      parents: {
        en: 'Daughter of Mr. A. Chandran Sangeetha Raj & Mrs. S. Helen Shanthi',
        ta: 'திரு. A. சந்திரன் சங்கீத ராஜ் – திருமதி. S. ஹெலன் சாந்தி அவர்களின் மகள்',
      },
      photo: '/images/photos/bride.jpg',
    } satisfies Person,
    /** Shown on the envelope wax seal and the loading screen. */
    initials: { groom: 'A', bride: 'S' },
    hashtag: '#AndrewWedsSharon',
    heroPhoto: '/images/photos/kstu8910.jpg',
    /** Point the cover photo slowly zooms towards (x% y%) — here, between the couple's faces. */
    heroFocus: '50% 20%',
  },

  wedding: {
    /** Start of the church ceremony — drives the countdown. */
    date: '2027-01-20T16:30:00+05:30',
    timeZone: 'Asia/Kolkata',
    /** Shown on the countdown after the wedding has started. */
    marriedSince: true,
  },

  content: {
    eyebrow: { en: 'Together with their families', ta: 'இரு குடும்பத்தாரின் ஆசிகளுடன்' },
    headline: { en: 'Two Hearts, One Beautiful Journey', ta: 'இரு இதயங்கள், ஒரு அழகிய பயணம்' },
    invitation: {
      en: 'With love in our hearts and blessings from our families, we invite you to celebrate our wedding.',
      ta: 'எங்கள் குடும்பத்தாரின் ஆசீர்வாதத்துடன், எங்கள் திருமண விழாவில் கலந்து கொண்டு சிறப்பிக்குமாறு அன்புடன் அழைக்கிறோம்.',
    },
    familyMessage: {
      en: 'By the grace of God and with the blessings of our elders, we joyfully request the pleasure of your company at the Holy Matrimony of our beloved children.',
      ta: 'தேவனுடைய கிருபையினாலும் பெரியோர்களின் ஆசியாலும் நிச்சயிக்கப்பட்ட எங்கள் அன்பு மக்களின் திருமண ஆராதனைக்கு தங்கள் சுற்றம் சூழ வருகை தந்து ஆசீர்வதிக்குமாறு அன்புடன் அழைக்கிறோம்.',
    },
    blessingQuote: {
      en: '“A cord of three strands is not quickly broken.” — Ecclesiastes 4:12',
      ta: '“முப்புரிநூல் சீக்கிரமாய் அறாது.” — பிரசங்கி 4:12',
    },
    eldersBlessing: {
      en: 'With the blessings of [Grandparents’ names / family elders]',
      ta: '[தாத்தா பாட்டி / குடும்பப் பெரியோர்] ஆசிகளுடன்',
    },
    closing: {
      en: 'Your presence, love, and blessings will make our celebration truly special. We look forward to sharing this beautiful beginning with you.',
      ta: 'தங்கள் வருகையும் அன்பும் ஆசியும் எங்கள் விழாவை மேலும் சிறப்பாக்கும். இந்த அழகிய தொடக்கத்தை உங்களுடன் பகிர்ந்து கொள்ள ஆவலுடன் காத்திருக்கிறோம்.',
    },
    weddingDayGreeting: {
      en: 'Today is the day! Thank you for being part of our beautiful beginning.',
      ta: 'இன்று எங்கள் திருமண நாள்! எங்கள் புதிய தொடக்கத்தில் பங்கேற்றதற்கு நன்றி.',
    },
    afterWedding: {
      en: 'We are married! Thank you for your love and blessings.',
      ta: 'எங்கள் திருமணம் இனிதே நடந்தேறியது! உங்கள் அன்பிற்கும் ஆசிக்கும் நன்றி.',
    },
  },

  story: [
    {
      title: { en: 'The Engagement', ta: 'நிச்சயதார்த்தம்' },
      text: {
        en: 'With the blessings of our parents and elders, our two families came together and we exchanged rings — the first step of a journey God had already planned for us.',
        ta: 'எங்கள் பெற்றோர் மற்றும் பெரியோர்களின் ஆசீர்வாதத்துடன், இரு குடும்பங்களும் ஒன்றிணைந்து நாங்கள் மோதிரம் மாற்றிக்கொண்டோம் — தேவன் எங்களுக்காக முன்பே திட்டமிட்ட பயணத்தின் முதல் அடி.',
      },
      photo: '/images/photos/kstu8616.jpg',
    },
    {
      title: { en: 'Getting to Know Each Other', ta: 'ஒருவரை ஒருவர் அறிந்துகொண்டோம்' },
      text: {
        en: 'What began as a match made by our families slowly grew into a friendship — long phone calls, shared laughter, prayers together and the joy of discovering each other.',
        ta: 'குடும்பத்தார் நிச்சயித்த உறவு மெல்ல ஒரு நட்பாக மலர்ந்தது — நீண்ட தொலைபேசி உரையாடல்கள், பகிர்ந்த சிரிப்புகள், இணைந்த ஜெபங்கள், ஒருவரை ஒருவர் கண்டறியும் மகிழ்ச்சி.',
      },
      photo: '/images/photos/kstu8873.jpg',
    },
    {
      title: { en: 'Two Names, One Promise', ta: 'இரு பெயர்கள், ஒரே வாக்குறுதி' },
      text: {
        en: 'Our names engraved side by side — a quiet reminder that from now on, every chapter of our lives will be written together.',
        ta: 'அருகருகே பொறிக்கப்பட்ட எங்கள் பெயர்கள் — இனி எங்கள் வாழ்வின் ஒவ்வொரு அத்தியாயமும் இணைந்தே எழுதப்படும் என்பதன் நினைவூட்டல்.',
      },
      photo: '/images/photos/rings_1.jpg',
    },
    {
      title: { en: 'Holy Matrimony', ta: 'திருமண ஆராதனை' },
      text: {
        en: 'Before God, our families and friends, we will say “I do” and begin our forever together. We would love for you to be there.',
        ta: 'தேவனுக்கும் எங்கள் குடும்பத்தினருக்கும் நண்பர்களுக்கும் முன்பாக, நாங்கள் ஒருவரை ஒருவர் ஏற்றுக்கொண்டு எங்கள் புதிய வாழ்வைத் தொடங்குகிறோம். நீங்களும் உடனிருக்க விரும்புகிறோம்.',
      },
      photo: '/images/photos/kstu8870.jpg',
    },
  ] as StoryMilestone[],

  /** Only events with `enabled: true` are displayed. */
  events: [
    {
      id: 'ceremony',
      kind: 'ceremony',
      enabled: true,
      name: { en: 'Holy Matrimony', ta: 'திருமண ஆராதனை' },
      start: '2027-01-20T16:30:00+05:30',
      venueName: 'C.S.I. Christ Church, Ambattur',
      address: 'M.T.H. Road, OT Bus Stand, Ambattur, Chennai, Tamil Nadu 600053',
      mapsQuery: 'C.S.I. Christ Church, M.T.H. Road, Ambattur, Chennai 600053',
      mapsUrl: 'https://maps.app.goo.gl/UiU9sbDcBZb3DueW9',
      description: {
        en: 'Join us as we exchange our vows before God, our families and friends.',
        ta: 'தேவனுக்கும் எங்கள் குடும்பத்தினருக்கும் நண்பர்களுக்கும் முன்பாக நாங்கள் திருமண உடன்படிக்கை செய்யும் இந்த ஆராதனையில் கலந்துகொள்ளுங்கள்.',
      },
    },
    {
      id: 'reception',
      kind: 'reception',
      enabled: true,
      name: { en: 'Reception', ta: 'வரவேற்பு' },
      start: '2027-01-20T18:30:00+05:30',
      venueName: 'MSK Diamond Mahal',
      address: 'No 38/39, Saraswathi Main Road, Aarthi Nagar, Thirumullaivoyal, Avadi, Tamil Nadu 600062',
      mapsQuery: 'MSK Diamond Mahal, Saraswathi Main Road, Thirumullaivoyal, Avadi 600062',
      mapsUrl: 'https://maps.app.goo.gl/WdJgTUiD8FKZ4vXw9',
      description: {
        en: 'Dinner, music and celebration with family and friends.',
        ta: 'குடும்பத்தினர் மற்றும் நண்பர்களுடன் விருந்து, இசை மற்றும் கொண்டாட்டம்.',
      },
    },
  ] as WeddingEvent[],

  /** One card per venue. Add a second entry for a separate reception venue. */
  venues: [
    {
      id: 'church',
      label: { en: 'The Church', ta: 'தேவாலயம்' },
      name: 'C.S.I. Christ Church, Ambattur',
      address: 'M.T.H. Road, OT Bus Stand, Ambattur, Chennai, Tamil Nadu 600053',
      mapsQuery: 'C.S.I. Christ Church, M.T.H. Road, Ambattur, Chennai 600053',
      mapsUrl: 'https://maps.app.goo.gl/UiU9sbDcBZb3DueW9',
      mapEmbedUrl: '',
      photo: '/images/photos/church.jpg',
      // Portrait photo: keep the tower and the "Christ Church" sign in the landscape card.
      photoPosition: '50% 38%',
      eventIds: ['ceremony'],
    },
    {
      id: 'reception',
      label: { en: 'Reception Venue', ta: 'வரவேற்பு அரங்கம்' },
      name: 'MSK Diamond Mahal',
      address: 'No 38/39, Saraswathi Main Road, Aarthi Nagar, Thirumullaivoyal, Avadi, Tamil Nadu 600062',
      mapsQuery: 'MSK Diamond Mahal, Saraswathi Main Road, Thirumullaivoyal, Avadi 600062',
      mapsUrl: 'https://maps.app.goo.gl/WdJgTUiD8FKZ4vXw9',
      mapEmbedUrl: '',
      photo: '/images/photos/mahal.jpg',
      eventIds: ['reception'],
    },
  ] satisfies Venue[],

  gallery: {
    autoplaySeconds: 4,
    photos: [
      { src: '/images/photos/kstu8857.jpg', caption: 'Together, with hearts full of joy', ratio: 2 / 3 },
      { src: '/images/photos/kstu8626.jpg', caption: 'A promise sealed with a ring', ratio: 3 / 2 },
      { src: '/images/photos/kstu8660.jpg', caption: 'Cutting the engagement cake', ratio: 2 / 3 },
      { src: '/images/photos/kstu8865.jpg', caption: 'Two rings, one promise', ratio: 2 / 3 },
      { src: '/images/photos/rings_2.jpg', caption: 'Engraved with our names', ratio: 600 / 511 },
      { src: '/images/photos/kstu8855.jpg', caption: 'A quiet, happy moment', ratio: 2 / 3 },
      { src: '/images/photos/kstu8859.jpg', caption: 'Hand in hand', ratio: 2 / 3 },
      { src: '/images/photos/kstu8899.jpg', caption: 'Side by side', ratio: 2 / 3 },
      { src: '/images/photos/kstu8853.jpg', caption: 'The ring that says forever', ratio: 2 / 3 },
      { src: '/images/photos/kstu8867.jpg', caption: 'Our engagement day', ratio: 2 / 3 },
      { src: '/images/photos/kstu8868.jpg', caption: 'Smiles that say it all', ratio: 2 / 3 },
    ] satisfies GalleryPhoto[],
  },

  music: {
    /**
     * Background music. Put the MP3 in /public/audio and point to it here.
     * It starts when the guest opens the envelope and loops softly.
     * Leave '' for no music (the sound button then controls effects only).
     */
    url: '/audio/a-thousand-years.mp3',
    title: 'A Thousand Years (instrumental)',
    volume: 0.45,
  },

  /** Soft sound effects (seal crack, chimes, page swishes). Made in code — no files needed. */
  sounds: {
    enabled: true,
    volume: 0.35,
    /**
     * Optional: a short recorded "Thank you for your blessings!" (MP3 in
     * /public/audio) played after a guest sends a wish. Leave '' to play a
     * soft thank-you melody instead.
     */
    thankYouUrl: '',
  },

  contact: {
    /** Optional — shown in the closing section. Use international format. */
    phone: '',
    /** WhatsApp number, digits only with country code e.g. 919800000000. */
    whatsapp: '',
  },

  wishes: {
    enabled: true,
  },

  /** Bilingual toggle. Set enabled:false for English only. */
  languages: { enabled: true, default: 'en' as 'en' | 'ta' },

  /**
   * Theme colours (hex). The defaults are a deep wine / antique gold palette.
   * Change these and every section updates.
   */
  theme: {
    'wine-950': '#2A060D',
    'wine-900': '#3D0A14',
    'wine-800': '#55111D',
    'wine-700': '#6E1A28',
    'wine-600': '#8A2535',
    gold: '#D4AF6A',
    'gold-soft': '#E9D3A4',
    'gold-deep': '#A9823F',
    cream: '#F6EBDD',
    blush: '#EDC2B4',
    rose: '#B23A48',
  },

  seo: {
    title: 'Andrew weds Sharon · Wedding Invitation',
    description:
      'You are warmly invited to the wedding of Andrew & Sharon on 20 January 2027. Tap to open the invitation, view the details and send your blessings.',
    /** 1200×630 JPG/PNG in /public — WhatsApp does not show SVG previews. */
    ogImage: '/og-image.jpg',
  },
};

export type WeddingConfig = typeof weddingConfig;
