# Streetside — Website

A production-ready marketing site for Streetside's residential bin valet
service, built from your logos, your Wix hero photo, and the brand
direction in your brief.

## Read this first: why it's HTML/CSS/JS instead of Next.js

The brief asked for Next.js + TypeScript. The environment this was built
in has **no internet access**, so `npm install next` (or any package,
or any CDN font) simply cannot run here — there's no way around that
from inside this sandbox.

Rather than fake a Next.js project that couldn't actually be installed
or run, this is a **complete, dependency-free static site** — plain
HTML, CSS, and vanilla JavaScript. It's fully real, fully functional,
and deployable right now to Vercel, Netlify, GitHub Pages, or any static
host with zero build step. Every interactive piece (mobile menu, scroll
reveal, the neighbor counter, form handling, FAQ accordion, pricing/FAQ
rendering) is implemented and tested — nothing here is a mockup.

If you do want this ported into Next.js/TypeScript later (for a CMS,
server-rendered forms, etc.), the structure below maps over directly:
`index.html` → `app/page.tsx` broken into components per section,
`config/site-config.js` → a typed `config/site.ts`, and each CSS file
becomes global or module CSS. That's a well-scoped follow-up task for
an environment with package-registry access — happy to do that conversion
in a future session if useful.

## What's in here

```
streetside-website/
├── index.html              All page markup (one page, anchor-linked sections)
├── privacy-policy.html     Privacy policy page
├── terms.html              Terms of service page
├── 404.html                Custom not-found page (Vercel serves this automatically)
├── admin.html              Password-protected dashboard for viewing real signups
├── robots.txt              Tells search engines they can crawl the site
├── sitemap.xml             Lists real pages for search engines
├── package.json            Only needed if you use the optional /api functions below
├── schema.sql              Database table definition (optional, see below)
├── api/                     Optional Vercel serverless functions
│   ├── waitlist.js           Saves form submissions to Postgres (+ optional Sheets/email)
│   ├── neighbor-count.js     Returns the real signup count
│   ├── interest-map.js       Returns signups grouped by city, for the map
│   ├── admin-login.js        Checks the admin password, issues a session cookie
│   ├── admin-logout.js       Clears the admin session cookie
│   ├── admin-data.js         Returns all signups (requires a valid session cookie)
│   ├── admin-update.js       Marks a signup contacted/not (requires a valid session)
│   ├── admin-delete.js       Deletes a signup (requires a valid session)
│   └── _admin-auth.js        Shared session-check helper (not its own route)
├── config/
│   └── site-config.js      Editable business data — START HERE
├── styles/
│   ├── tokens.css          Colors, type scale, spacing (design tokens)
│   ├── base.css            Reset + global typography/utilities
│   ├── components.css      Buttons, nav, cards, forms, FAQ, counter
│   └── sections.css        Per-section layout (hero, pricing, footer…)
├── scripts/
│   ├── nav.js               Sticky header + mobile menu + active link
│   ├── reveal.js             Scroll-reveal animation
│   ├── counter.js            Neighbor counter (manual today, API-ready)
│   ├── waitlist-form.js      Waitlist + address-check form handling
│   ├── interest-map.js       Draws the service-area map from real signups
│   ├── scroll-ui.js          Sticky mobile CTA bar + back-to-top button
│   └── main.js                Renders pricing/FAQ from config
└── images/
    ├── streetside-logo-horizontal.png   Your real logo (header)
    ├── streetside-logo-circular.png     Your real logo (footer/favicon)
    ├── hero-bins-house.jpg              Your real hero photo
    ├── favicon-*.png, icon-*.png, apple-touch-icon.png
    └── how-it-works/*.svg               Placeholder step icons (see below)
```

## How to run it locally

No install needed. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser (a couple of things,
like `fetch`-based form submission, work best served over http:// rather
than file://).

## How to deploy

Any static host works as-is:
- **Vercel**: `vercel deploy` from this folder (framework preset: "Other").
- **Netlify**: drag-and-drop this folder, or connect the repo (no build
  command needed, publish directory = this folder).
- **GitHub Pages**: push this folder to a repo and enable Pages.

## Optional: real form storage with Vercel Functions + Postgres

The site ships with two ready-to-use serverless functions in `/api` —
`waitlist.js` and `neighbor-count.js` — that save real form
submissions to a Postgres database and let the neighbor counter read
its number live. **These only run if you deploy on Vercel** (a plain
static host like Netlify/GitHub Pages will ignore the `/api` folder).
If you'd rather not deal with a database at all, skip this section
and use a forms service like Formspree instead — either one plugs
into the same `waitlistForm.endpoint` config value.

Important: Vercel's free "Hobby" plan is for non-commercial projects
only. Since Streetside is a business, you'll want a **Pro plan**
(~$20/month) to use Vercel for this site.

1. **Install the Vercel CLI** (one-time): `npm install -g vercel`,
   then `vercel login`.
2. **Link this folder to a Vercel project**: from inside
   `streetside-website/`, run `vercel link` (creates the project on
   your Vercel account if it doesn't exist yet).
3. **Provision a database** — from the same folder, run
   `vercel install neon` and follow the prompts (or do this from the
   Vercel dashboard under your project's Storage tab → Marketplace →
   Neon). This automatically sets a `DATABASE_URL` environment
   variable on your project — you don't need to copy/paste a
   connection string by hand.
4. **Create the table** — open your new database in the Neon
   dashboard, go to its SQL Editor, and run everything in
   `schema.sql` (included in this folder) once.
5. **Deploy**: `vercel --prod` from this folder. Vercel will run
   `npm install` (picking up `@neondatabase/serverless` from
   `package.json`) and publish both the site and the two functions
   at `/api/waitlist` and `/api/neighbor-count`.
6. **Test it** — submit the waitlist form on your live Vercel URL and
   confirm a new row shows up in Neon's table view. Once that works:
   - Set `waitlistForm.endpoint` to `"/api/waitlist"` in
     `config/site-config.js`.
   - Set `neighborCounter.source` to `"api"` and
     `neighborCounter.apiEndpoint` to `"/api/neighbor-count"` in the
     same file.
   - Redeploy (`vercel --prod` again). From then on, the counter
     reads the real signup count automatically — no more hand-editing
     `neighborCounter.count`.

If anything about your database connection is misconfigured, both
functions fail loudly (a 500 response and a console log) rather than
silently pretending to work — the site's existing error-handling in
`scripts/waitlist-form.js` and `scripts/counter.js` already accounts
for that.

## Optional: also mirror submissions to a Google Sheet

The database (above) is the real source of truth — the neighbor
counter, the map, and the address-check logic all read from it. But
if you'd like a plain spreadsheet copy of every submission too (handy
for skimming without opening Neon), `api/waitlist.js` can also send
each one to a Google Sheet. This uses a **Google Apps Script Web App**
instead of Google's full API — no service account or Cloud Console
setup needed, just a script pasted into the Sheet itself.

1. **Create a new Google Sheet** (or use an existing one) at
   sheets.google.com. Name it something like "Streetside Signups."
2. **Open the script editor**: in the Sheet, click
   **Extensions → Apps Script**.
3. **Delete whatever's in the editor** and paste this in its place:

   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var data = JSON.parse(e.postData.contents);

     var headers = ["Submitted At", "Form Type", "First Name", "Last Name",
       "Email", "Phone", "Street Address", "City", "ZIP", "Collection Day",
       "Waste Provider", "Trash Bins", "Recycling Bins",
       "Bin Storage Location", "Interested Package", "Heard About Us", "Consent"];

     if (sheet.getLastRow() === 0) {
       sheet.appendRow(headers);
     }

     sheet.appendRow([
       data.submittedAt || "", data.formType || "", data.firstName || "",
       data.lastName || "", data.email || "", data.phone || "",
       data.streetAddress || "", data.city || "", data.zip || "",
       data.collectionDay || "", data.wasteProvider || "",
       data.trashBinCount || "", data.recyclingBinCount || "",
       data.binStorageLocation || "", data.interestedPackage || "",
       data.hearAboutUs || "", data.consent ? "Yes" : "No"
     ]);

     // Send the person a confirmation email — only for full waitlist
     // signups, since the address-check form doesn't collect an email.
     // Sent from your own Gmail account (whichever Google account owns
     // this script); wrapped in try/catch so a mail hiccup never
     // breaks the row from being saved above.
     if (data.formType === "waitlist" && data.email) {
       try {
         var subject = "You're on the Streetside waitlist!";
         var body =
           "Hi " + (data.firstName || "there") + ",\n\n" +
           "Thanks for joining the Streetside waitlist! We've got your details for " +
           (data.streetAddress ? data.streetAddress + ", " : "") +
           (data.city || "your area") + ".\n\n" +
           "We'll reach out as soon as a route opens near you. In the meantime, " +
           "every neighbor who signs up helps bring that day closer.\n\n" +
           "— Streetside\n" +
           "We take it to the street. You don't have to.";
         MailApp.sendEmail(data.email, subject, body);
       } catch (err) {
         // Logged in Apps Script's execution log (View > Executions)
         // if you ever want to check — never blocks the row save above.
         console.error("Confirmation email failed: " + err);
       }
     }

     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. **Save** (the disk-icon button, or Ctrl+S), giving the project any
   name when prompted.

   If you already deployed this script before adding the email step,
   you'll need to re-authorize it — Google will prompt for an
   additional "send email on your behalf" permission the next time
   you run or redeploy it. That's expected; approve it the same way
   as the first authorization.
5. **Deploy it**: click **Deploy → New deployment**. Next to "Select
   type," click the gear icon and choose **Web app**. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
   Click **Deploy**. The first time, Google will ask you to authorize
   the script — click through the consent screens (it'll warn that
   the app isn't verified, which is expected for a script you wrote
   yourself; click **Advanced → Go to \[project name\] (unsafe)** to
   proceed).
6. **Copy the Web App URL** it gives you after deploying — it looks
   like `https://script.google.com/macros/s/AKfycb.../exec`.
7. **Add it to Vercel**: in your project on vercel.com, go to
   **Settings → Environment Variables**, add a new one named
   `GOOGLE_SHEETS_WEBHOOK_URL` with that URL as the value.
8. **Redeploy** (upload the updated `api/waitlist.js` the same way as
   any other update, or just redeploy if only the environment
   variable changed — Vercel needs a fresh deployment to pick up a
   new environment variable).
9. **Test it** — submit the waitlist form on your live site and check
   that a new row appears in the Sheet, and that the email address you
   used receives a confirmation email within a minute or two.

If this ever stops working, the database save still always succeeds
independently — check your Vercel function logs for a
"Google Sheets sync failed" warning to see what went wrong, without
worrying about losing the actual signup.

A personal Gmail account can send about 100 emails/day through
Apps Script (a Google Workspace account gets more) — plenty for a
launching business, but worth knowing if signups ever spike hard in
one day.

## Admin dashboard — viewing your real signup data

There's a password-protected admin page at `/admin.html` that shows
every real signup: name, contact info, address, which plan they're
interested in, and a few summary counts. There's a small "Employee
Login" link in the footer of every page that goes there.

The dashboard also includes:
- **Interest by city** — a real-time breakdown showing how many
  signups exist per city, sorted by count, so you can see at a
  glance which town is closest to having enough interest for a route.
- **Search + filters** — search by name/email/phone/address/city,
  or filter by submission type, plan, or city.
- **Export CSV** — downloads whatever's currently visible (respects
  active filters) as a spreadsheet file.
- **Mark as Contacted** — a checkbox per row; contacted rows are
  highlighted green so you can track who you've already reached out
  to.
- **Delete** — permanently removes a row (with a confirmation
  prompt first) — handy for clearing out test entries.
- **Refresh** — reloads the data without leaving the page.

**How the security actually works, in plain terms:**
- You set a password yourself (an environment variable, never
  written into the code or stored in the database).
- When you log in, the server checks it and — if correct — gives
  your browser a signed, encrypted-looking cookie that proves you
  logged in, good for 12 hours.
- Every time the admin page asks for data, the server re-checks that
  cookie's signature before returning anything. A cookie that's
  missing, expired, or doesn't match is rejected with no data sent.
- The page itself is marked so Google won't index it — but that's
  just extra privacy, not the real protection. The password + signed
  cookie is what actually keeps the data locked down; anyone who
  finds the link still has to get through that.

**Setup (two environment variables in Vercel, same place as
`DATABASE_URL`):**

1. In your Vercel project: **Settings → Environment Variables**.
2. Add `ADMIN_PASSWORD` — pick a real password here, something you
   wouldn't mind a customer's data being protected by. Not "password123".
3. Add `SESSION_SECRET` — a long random string used to sign the
   login cookie so it can't be forged. Any long random text works;
   a quick way to generate one is running this in your browser's
   JavaScript console: `crypto.randomUUID() + crypto.randomUUID()`
4. Run this in Neon's SQL Editor if you haven't already (adds the
   column the "Mark as Contacted" feature needs):
   ```sql
   ALTER TABLE signups ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT FALSE;
   ```
5. Redeploy (upload the files the same way as always, or just
   redeploy if only the environment variables changed).
6. Visit `/admin.html` on your live site and log in with the
   password you set in step 2.

If you ever suspect the password has leaked, just change
`ADMIN_PASSWORD` in Vercel and redeploy — that immediately
invalidates it. Changing `SESSION_SECRET` also immediately logs
out anyone with an existing session, including yourself (you'd
just log back in with the current password).

## Route Planner — planning your actual driving route

Also on the admin dashboard: check the "Route" box on any rows in
the table to build today's driving route. Reorder stops with the
↑/↓ buttons, optionally set a starting address (your home base),
then click "Open Route in Google Maps" — it opens a real turn-by-
turn Google Maps route with your stops in that order.

This doesn't do its own route optimization or geocoding — it hands
your addresses straight to Google Maps and lets Google's own
directions engine do the actual routing, which is both simpler and
more reliable than trying to rebuild that from scratch. Google Maps
links support at most 9 stops per trip; the checkbox stops you at 9
with a message rather than silently dropping stops past that —
split a bigger day into two trips.

**Sorting stops by distance:** once you've typed a starting address
that includes a recognized nearby town, two buttons appear —
"Closest → Furthest" and "Furthest → Closest" — that reorder your
selected stops by straight-line distance from that starting point.
This uses the same real town coordinates behind the public map, not
a routing API, so it's town-center-to-town-center distance in a
straight line, not actual road distance. It's a genuinely useful
starting order for a route, not true turn-by-turn optimization —
Google Maps' own directions (which you open right after) will
already account for actual roads once you're using the link.

**Waitlist Interest Map:** a real interactive map above the route
planner — actual roads and geography (via OpenStreetMap, a free,
open map service — no API key needed), not the stylized illustrated
map on the public site. Towns with real waitlist interest are
highlighted using their **actual municipal boundary** where
OpenStreetMap has one on file — not a generic circle — colored
using the same warmer-means-more-interest scale as the public map.
If a specific town's real boundary can't be found, it falls back to
a colored circle instead, so nothing ever looks broken. It's
private to you, filtered to real waitlist signups only — address-
check lookups aren't counted. For your own reference when deciding
where to plan routes, not a selection tool — select stops for the
route from the checkboxes in the table below it instead.

Boundaries load in gradually, one town at a time, about a second
apart — that's deliberate, not a bug: it respects the usage limits
of the free service providing this data. You'll see a circle for
each town immediately, then it gets replaced by the real boundary
shape once it loads a moment later.

A note on why this differs from the public map: the public map
deliberately avoids any external map service, so it can never
break for a visitor if a third-party map provider has an outage —
that's worth protecting on a page meant to convert visitors into
signups. This admin page is different: it's just for you, so a real
map with real roads and real boundaries is more useful here than
that tradeoff matters.

## Launch checklist — what still needs real data

Nothing fake is shown anywhere on the site. Instead, these are clearly
marked as pending in `config/site-config.js` and in the UI itself:

- [ ] **Pricing** — all three plans show "TBD" until you set real `price`
      values in `config/site-config.js`.
- [ ] **Waitlist form backend** — forms currently tell the visitor
      honestly that signups aren't connected yet. Either (a) sign up
      for a forms service like Formspree/Getform/Basin and set
      `waitlistForm.endpoint` to that URL, or (b) use the built-in
      Vercel Functions + Postgres setup described above and set it to
      `"/api/waitlist"`. See the comment block at the top of
      `scripts/waitlist-form.js` for exactly what happens before and
      after you do this.
- [ ] **Neighbor counter** — starts at `0` as required. Update
      `neighborCounter.count` by hand as real signups come in, or wire
      `neighborCounter.apiEndpoint` once you have a backend (see the
      comments in `scripts/counter.js` and the config file).
- [ ] **Contact email / phone** — set `business.contactEmail` /
      `contactPhone` in the config; the footer will switch out of its
      "coming soon" placeholder automatically.
- [ ] **Social links** — set them in `business.socialLinks`, or leave
      blank (the icons hide themselves rather than link nowhere).
- [ ] **Service area list** — `serviceArea.activeAreas` /
      `waitlistAreas` are empty arrays, ready for you to add real
      cities/ZIPs/neighborhoods as routes open.
- [ ] **FAQ answers** — a handful of FAQ entries (delayed collection,
      holiday schedule, billing, cancellation, service confirmation)
      have no established policy yet, so they render as an orange
      "not yet finalized" placeholder chip instead of an invented
      answer. Fill in the `a` field for each once you've decided.
- [ ] **How It Works photography** — the four step icons are simple
      brand-colored placeholder graphics (not real photos), each
      tagged "Photo coming soon." Swap the `<img>` src in `index.html`
      for real photos once you have them — same 1:1 aspect ratio.
- [ ] **Legal pages** — Privacy Policy / Terms footer links point to
      `#` placeholders; no such pages exist yet.

## About the fonts

The brief asked for a bold/condensed/industrial display face. Because
this environment can't reach Google Fonts or any CDN, headings use a
carefully chosen **system font stack** (`Archivo Narrow` /
`Roboto Condensed` / `Arial Narrow` and similar, with `font-stretch:
condensed`) — so the look holds up on real devices without a webfont
download, though it won't be pixel-identical to a specific font like
Oswald or Bebas Neue.

To get an exact match later: download **Oswald** or **Bebas Neue**
(both free/open-license) from Google Fonts, drop the `.woff2` files
into a new `fonts/` folder, and add an `@font-face` block at the top
of `styles/tokens.css` pointing `--font-display` at it. Everything
else (sizing, spacing, weight) is already set up to take it as-is.

## About the hero photo

Your uploaded Wix screenshot had the hero photo and the on-page text/
buttons flattened into one image, so the original clean photo (behind
your text) wasn't separately available. `hero-bins-house.jpg` is a
crop taken from the unobstructed right-hand portion of that same
screenshot — the actual house and bins from your photo, just isolated
from the overlaid UI. If you have the original, uncropped photo file,
drop it in as `images/hero-bins-house.jpg` (same filename) for a
higher-resolution version.

## Accessibility & performance notes

- Skip-to-content link, visible focus states, `prefers-reduced-motion`
  respected throughout.
- All images have descriptive alt text; decorative icons are
  `aria-hidden`.
- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and
  a heading hierarchy that starts at one `<h1>` in the hero.
- Tested at 1440px (desktop), 820px (tablet), and 390px (mobile) with
  zero console errors, plus interaction tests for the mobile menu, FAQ
  accordion, anchor navigation, and both forms (empty-state validation
  and a full valid submission).
