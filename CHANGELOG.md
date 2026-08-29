# Changelog

Version numbers correspond to each delivered zip/package, starting
at v25.0. Not tied to git commits — just a simple way to keep track
of which round of changes you're looking at.

## v27.1 — current

Four small additions, no business decisions needed for any of them:

- **Clickable phone/email in the admin table** — tap a phone number
  to call, click an email to open your mail app, instead of copying
  text manually.
- **Click-to-sort admin table columns** — click "Submitted," "Type,"
  "Name," "City," "Package," or "Contacted" to sort by it; click
  again to reverse. A small arrow shows the active sort.
- **Sticky "Join the Waitlist" bar on mobile** — appears once
  someone scrolls past the hero's own button, hides again once they
  reach the real waitlist form.
- **Back-to-top button** — small floating arrow, appears after
  scrolling down, smooth-scrolls back to the top on click.

## v27.0

Big round of admin dashboard additions:

- **Interest by City** panel — real per-city signup counts, sorted
  by count, so you can see which town is closest to route-ready
  demand at a glance.
- **Export CSV** — downloads whatever's currently visible (respects
  active search/filters) as a spreadsheet file.
- **Mark as Contacted** — a checkbox per row; contacted rows
  highlight green in the table. Requires one new database column
  (`contacted`) — migration line is in schema.sql and the README.
- **Delete a row** — with a confirmation prompt, for clearing out
  test/duplicate entries without needing to open Neon directly.
- **Consent column** — now visible in the table (the data was
  already being collected, just wasn't shown before).
- **Refresh button** — reload the data without leaving the page.
- Two new protected API endpoints (`admin-update.js`,
  `admin-delete.js`) plus a shared `_admin-auth.js` helper so all
  four admin endpoints check sessions identically.

## v26.1

- Added an "Employee Login" link to the footer of every page,
  pointing to `/admin.html` — no more typing the URL by hand.
- Added real filtering to the admin dashboard: search box (name,
  email, phone, address, city), plus dropdown filters for
  submission type, interested plan, and city (auto-populated from
  real data). Shows a live "Showing X of Y" count, with a one-click
  Clear button.

## v26.0

- Added a password-protected admin dashboard at `/admin.html` —
  view every real signup (name, contact, address, plan interest)
  plus summary counts, without needing to open Neon directly.
- Real security, not just a password box: password lives only in a
  Vercel environment variable (never in code), login issues a
  signed session cookie (HMAC-SHA256, 12-hour expiry), every data
  request re-verifies that signature server-side, and password
  comparison uses a constant-time check to resist timing attacks.
  See README.md → "Admin dashboard" for the 2-variable setup.
- Page is marked noindex and excluded in robots.txt, and isn't
  linked from anywhere on the public site.

## v25.2

- Added a "Founding Members Save 50% — Claim Your Discount" badge
  to the hero, linking to the pricing section — no numbers involved,
  just a clear call-out for the discount now that the counters are
  gone.

## v25.1

- Removed the Founder-spots counters from both the hero and the
  "Built for Neighborhoods" section — no visible number for now.
- Brought back the heatmap version of the service-area map (was
  tried, reverted to pins, now restored) — soft colored glows sized
  and colored by real per-town demand instead of growing pins.

## v25.0

- Fixed: waitlist submissions with only a phone number (no email)
  were being rejected by the server — a validation rule left over
  from before the "Email or Phone" field was combined into one.
- Fixed: that combined field had `autocomplete="email"` left on it,
  which biased mobile keyboards/autofill toward email even though
  the field accepts both.
- Waitlist form shortened to 7 fields (name, one contact field,
  address, plan interest, consent) — collection day, waste
  provider, bin counts, storage location, and "how did you hear
  about us" moved out of the initial ask to reduce friction.
- Plan dropdown on the waitlist form now shows real prices, pulled
  live from the same config as the pricing cards.
- Hero and "Built for Neighborhoods" counters both now show real
  Founder spots remaining (250 minus real signups) instead of a
  raw neighbor count.
- Heatmap experiment tried and reverted back to the pin-based map.
- "Interested package" field and database column added, so you can
  see which plan each signup is actually interested in.
- "Bring a neighbor" share prompt added after a successful signup.
- Google Sheets mirror + confirmation email support (optional,
  documented in README.md).
- Vercel Web Analytics wired in.
- robots.txt, sitemap.xml, and a custom 404 page added.
- Full I-270 loop, I-70, and US-33 traced from real reference maps
  rather than approximated.
- Buckeye Lake drawn as its real traced outline, not a plain oval.
- Pricing rebuilt around real numbers: Curb Service, Full Service,
  One-Time Service, with the Founding 250 discount shown as a
  corner ribbon on each card.
