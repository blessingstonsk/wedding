# Digital Wedding Invitation

A cinematic, mobile-first wedding invitation for Andrew & Sharon, in a deep wine, antique gold and rose theme. It's built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Lucide icons. Guest wishes are optional and use Supabase through Netlify Functions.

**Guest journey:** loading screen → envelope with wax seal → hero (couple) → family → love story → countdown and wedding calendar → events → venues → gallery → wishes → share → closing.

---

## 1. Run it on your computer

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To see the envelope again, open the page in a new tab. The "opened" state only lasts for the current tab.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds the production site into `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |
| `npm run typecheck` | TypeScript check only |

---

## 2. Replace the sample content

**Almost everything lives in one file: [`src/config/weddingConfig.ts`](src/config/weddingConfig.ts).** Anything in `[square brackets]` is a placeholder.

| What | Where in `weddingConfig` |
| --- | --- |
| Names, parents, initials, hashtag | `couple` |
| Church ceremony date and time (drives the countdown) | `wedding.date` |
| Headline, invitation text, blessing, closing message | `content` |
| Love-story timeline | `story` |
| Holy Matrimony (church) and Reception | `events` (set `enabled: false` to hide an event) |
| Venue cards and maps | `venues` |
| Gallery photos and captions | `gallery.photos` |
| Background music | `music.url` |
| Phone and WhatsApp contact | `contact` |
| Colours | `theme` |
| Link preview title, description and image | `seo`, `siteUrl` |

### Dates and time zone

Always write dates with the IST offset, for example `'2027-01-20T10:00:00+05:30'`. The countdown, calendar links and all date text use `Asia/Kolkata`, so guests anywhere in the world see the correct time.

### Text in Tamil

Any text field can be a plain string, or `{ en: '...', ta: '...' }` for the English / தமிழ் toggle. If `ta` is missing, the English text is shown. Fixed button labels are in [`src/lib/i18n.tsx`](src/lib/i18n.tsx). To show English only, set `languages.enabled: false`.

### Photos

Placeholder images are in `public/images/` and are clearly labelled (for example "COUPLE PHOTO · REPLACE"). To use your own photos:

1. Put your photos in `public/images/`. Use JPG or WebP, around 1600px on the longest side and under 400 KB each.
2. Update the paths in `weddingConfig.ts`, for example `heroPhoto: '/images/couple.jpg'`.
3. For gallery photos, set `ratio` to width ÷ height, for example `4 / 5` for a portrait photo. This keeps the layout from jumping while photos load.

Suggested shapes:

- **Hero photo:** 3:4 portrait
- **Groom and bride photos:** square
- **Story and venue photos:** 16:10

### WhatsApp link preview

WhatsApp can't show SVG images. Replace `public/og-image.jpg` with a **1200×630 JPG** of the couple, under 300 KB. Then set `siteUrl` to your real address, because the preview needs a full URL.

### Music

Put an instrumental MP3 at `public/audio/background-music.mp3`, or change `music.url`. Music only starts when the guest taps "Open Invitation", so it isn't blocked by the browser. The mute button only appears if the file exists.

### Personalised greeting

Add `?guest=Name` to the link, for example `https://your-site/?guest=Priya%20%26%20Family`. The envelope and hero will then greet that guest by name.

The name is cleaned (letters and spaces only, at most 40 characters), shown as plain text, and never saved or sent anywhere. The share buttons always share the plain link without the name.

You can also add `?lang=ta` to open the page in Tamil.

### Maps

Each event and venue has a `mapsQuery`. This can be a place name, an address or `"lat,lng"`. It is used for the "Directions" buttons, which open the Google Maps app on phones.

To use an exact pinned map, open Google Maps → Share → Embed a map, copy the `src` URL, and paste it into the venue's `mapEmbedUrl`.

---

## 3. Guest wishes backend (optional)

### Try it locally first (no accounts needed)

`npm run dev` includes a small **local test backend** ([`dev/mockApi.ts`](dev/mockApi.ts)), switched on by [`.env.development.local`](.env.development.local). It behaves like the real one but saves wishes to `.dev-data/wishes.json` on your computer.

1. Run `npm run dev` and open http://localhost:5173.
2. Send a blessing from the **Wishes & Blessings** section. It is held for approval.
3. Open http://localhost:5173/admin and sign in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env.development.local`. You stay signed in on that browser for 30 days.
4. Click **Approve**. The blessing now appears on the invitation page.

To start fresh, delete the `.dev-data` folder. None of this is included in the built or deployed site.

### Going live

The site works fully without a backend. In that case, the wishes section shows a short "will open here soon" message. To turn it on:

### a. Supabase

1. Create a free project at https://supabase.com.
2. Go to **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Go to **Project Settings → API** and copy the **Project URL** and the **service_role** key.

How this keeps the data safe:

- Row Level Security is on, and the public `anon` role has no access at all.
- Only the server functions can read or write data, using the service key.
- The service key is **never** included in the website code.

### b. Environment variables

Copy `.env.example` to `.env` for local testing and fill it in. When you deploy, add the same variables in Netlify (see section 4). Remember to set `VITE_BACKEND_ENABLED=true`.

### c. Test locally with functions

```bash
npm install -g netlify-cli
netlify dev
```

Then open http://localhost:8888. This serves the site and the `/api/*` functions together. Plain `npm run dev` does not run the functions.

### What the backend does

| Endpoint | Purpose |
| --- | --- |
| `GET /api/wishes` | Returns **approved** wishes only. |
| `POST /api/wishes` | Saves a new wish for moderation. Messages containing links are rejected. Set `WISHES_AUTO_APPROVE=true` to publish wishes immediately. |
| `/api/admin` | Family dashboard API. Requires signing in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. |

Spam protection:

- A hidden honeypot field catches bots.
- Each IP address can submit 5 wishes per 10 minutes. IPs are stored only as a salted hash.
- Requests from other websites are rejected.
- Text is cleaned and length-checked on the server.

### Family dashboard

Go to **`/admin`** on your site and sign in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set in Netlify. From there you can approve or delete guest wishes.

- You stay signed in on that browser for **30 days**, or until you click **Sign out**.
- The password is checked on the server and never sent to guests. The sign-in cookie can’t be read by page scripts.
- After 5 wrong attempts, sign-in pauses for 10 minutes.
- Changing `ADMIN_PASSWORD` signs out every device.

---

## 4. Deploy to Netlify (when you're ready)

1. Push this folder to GitHub. Or run `npm run build` and drag the `dist/` folder onto https://app.netlify.com/drop. Note that the drag-and-drop option is static only, with no wishes backend.
2. On Netlify, choose **Add new site → Import from Git** and pick the repository. The build settings are read from `netlify.toml`: build command `npm run build`, publish folder `dist`, functions in `netlify/functions`.
3. Go to **Site configuration → Environment variables** and add the variables from `.env.example`.
4. Deploy. Then set `siteUrl` in `weddingConfig.ts` to your final URL and deploy again, so share links, the QR code and WhatsApp previews use the right address.
5. Optional: add a custom domain under **Domain management**.

> After you change the photo or title, WhatsApp may keep showing the old preview for a while. To refresh it, share the link with `?v=2` added to the end.

---

## 5. Project structure

```
src/
  config/weddingConfig.ts   ← edit this
  lib/                      i18n, dates (IST), calendar and maps links, API, invite-card renderer
  hooks/useCountdown.ts
  components/
    chrome/                 loading screen, envelope, navbar, music, scroll progress
    sections/               Hero, Family, Story, Countdown, Events, Venue, Gallery, Wishes, Share, Closing, PrintCard
    ui/                     Florals (SVG roses and motifs), Petals (canvas), Section helpers
    admin/AdminPanel.tsx    /admin dashboard
netlify/functions/          wishes.ts, admin.ts (server-side)
netlify/lib/shared.ts       Supabase client, validation, rate limiting
supabase/schema.sql         database tables and security
public/                     images, og-image.jpg, favicon, audio
```

## Accessibility and performance

- The site respects the phone's **reduced motion** setting: falling petals are turned off and animations are simplified.
- Everything works with the keyboard, focus outlines are visible, and dialogs close with Esc.
- Photos load only when needed. The map loads only when a guest taps "Show map".
- There are at most 14 petals on screen, and they pause when the browser tab is hidden.
- **Print:** the Share section's "Print" button prints a clean A5 invitation.
- **Download Card:** creates a 1080×1350 PNG invitation with a QR code. This happens in the browser, with no server needed.
