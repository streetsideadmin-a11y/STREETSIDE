# Changelog

Version numbers correspond to each delivered zip/package, starting
at v25.0. Not tied to git commits — just a simple way to keep track
of which round of changes you're looking at.

## v31.0 — current

- Added a **Select Customers on Map** panel to the admin dashboard —
  a small map with a pin for every signup, plus real drag-a-lasso
  selection: draw a shape around a group of pins to add them all to
  the route at once, or click a single pin to toggle just that one.
- Reuses the same real town coordinates already powering the route
  sort feature and the public map — no new dependency.
- Honest about the real limit: pins are placed at the town level,
  not the exact street address (we don't geocode that precisely
  yet) — two signups in the same town get spread apart a little so
  both are visible and separately selectable, not placed at their
  real address. Stated plainly in the panel itself, not buried.
- Fully wired into the existing route system — selecting on the map,
  checking a box in the table, and removing a stop from the route
  list all stay in sync with each other automatically.
- Tested map rendering (pins skip unrecognized towns rather than
  guessing), click-to-toggle, and lasso selection precisely
  targeting a subset of pins while leaving others untouched.

## v30.1

- Added distance-based sorting to the Route Planner: "Closest →
  Furthest" and "Furthest → Closest" buttons reorder your selected
  stops using straight-line distance from a typed starting address.
- Uses the same real town coordinates that already power the public
  map — no new API or geocoding service needed. Buttons stay
  disabled until the starting address includes a town the map
  actually recognizes, so it never silently sorts against a wrong
  guess.
- Tested against real known distances from Columbus (Groveport
  ~10mi, Circleville ~26mi, Lancaster ~29mi, Newark ~33mi) — sorted
  in exactly the right order both directions.
- Honest about its limits, in the UI itself: this is straight-line
  town-center distance, not real road distance or true route
  optimization — a solid starting order, with Google Maps' own
  directions (opened right after) handling the actual roads.

## v30.0

- Added a **Route Planner** to the admin dashboard — check the
  "Route" box on any signup to add it as a stop, reorder with
  ↑/↓ buttons, optionally set a starting address, then "Open Route
  in Google Maps" for real turn-by-turn directions in that order.
- No geocoding or route-optimization infrastructure needed — it
  builds a standard Google Maps directions link and lets Google's
  own engine handle the actual routing.
- Capped at 9 stops per route (Google's own link limit) — the 10th
  checkbox is rejected with a clear message instead of silently
  breaking the link.
- Tested the full flow: selecting stops, reordering, removing,
  syncing with the table checkboxes, the 9-stop cap, and the
  generated Google Maps URL itself (confirmed it matches Google's
  documented format exactly).

## v29.1

- Smaller towns now get a smaller heat zone too, at every interest
  level — not just smaller dots and text. Same 5 signups gives
  Lancaster a much bigger glow than Somerset, matching the same
  "main cities are visually louder" idea from the last update.

## v29.0

Major map expansion — from 23 towns to 45:

- **Re-added** Royalton, Walnut, North Berne, Pleasantville, and
  Kirkersville (previously removed, brought back at your request).
- **Added 17 new towns** from your latest reference map: Heath,
  Alexandria, Granville, Welsh Hills, Hanover, Thornport, Thornville,
  Glenford, Junction City, Wesley Chapel, Bremen, Sugar Grove,
  Hideaway Hills, Stoutsville, Orient, Commercial Point, Shawnee.
- **Recentered on the natural region**, not a specific town — the
  map now centers on the real geographic middle of everywhere it
  covers, rather than being anchored to Lancaster or Columbus.
- **Smaller towns are visually lighter now** — smaller dots (3.2px
  vs 7px) and smaller text (10px vs 13px) than the main cities, so
  a big cluster of newly-lit-up towns doesn't overpower the map.
- All 45 towns are fully wired into the heatmap system — every one
  stays hidden until real interest lights it up, same as before.
- Excluded the far-northwest Columbus suburbs visible in the
  reference (Dublin, Worthington, Westerville, New Albany, Gahanna,
  Upper Arlington) since they're in the opposite direction from
  your stated Southeastern Columbus market — let me know if you
  want those added too.

## v28.1

- Smaller towns (everything except the 9 main cities) are hidden
  from the map by default again — decluttered the at-rest view down
  to just the main cities, roads, and landmarks.
- Their positions and heat-glow behavior are untouched — the moment
  real waitlist interest comes in from one of those towns, its dot,
  label, and heat glow all appear exactly as before. Nothing about
  the underlying data or matching logic changed, just what's shown
  before there's any real interest to display.

## v28.0

Full map rebuild — recentered and expanded:

- **Recentered on Lancaster** — the map used to be Columbus-heavy
  with Lancaster off in a corner; every position was recalculated
  so Lancaster now sits at the true center, with bounds expanded
  equally in every direction from it.
- **Added Grove City, Somerset, and New Lexington** as new towns
  (Grove City as a full city-tier dot, the other two as smaller
  towns) — all three light up on the heatmap the same as everywhere
  else.
- **Traced 4 new roads** from a fresh reference map, calibrated the
  same way as before (known town positions as anchors): I-71, US-23,
  SR-37, and an eastward extension of SR-256 out toward Somerset.
- Every existing town, landmark, road, and the Buckeye Lake outline
  were all recalculated for the new bounds — nothing kept its old
  position, everything shifted together so relative distances stay
  accurate.
- Fixed a label collision this rebuild introduced (Etna was
  overlapping Reynoldsburg's label at the new scale).

## v27.3

Real bug fix: address-check submissions were incorrectly counting
as "interest" in two places.

- **The public map's heat glow** now only lights up from real
  waitlist signups — checking an address no longer nudges a town's
  heat intensity up. Address-check is a lookup against data you've
  already collected, not a new signal of demand.
- **The "X neighbors are interested" message** shown after an
  address-check now counts only real waitlist signups too (was
  previously counting other address-checks, and even the person's
  own check, as "interest"). Also fixed the message to correctly
  show up starting at 1 real neighbor instead of requiring 2+, and
  fixed "1 neighbors" → "1 neighbor" grammar.

## v27.2

- Added Newark and Circleville to the service-area map as full
  city-tier towns (same treatment as Columbus, Lancaster, etc.) —
  always visible, labeled, and light up on the heatmap when real
  interest comes in from either city.
- Both fit within the map's existing bounds, so nothing else on the
  map had to move. Circleville's real position sat right where the
  caption text overlay covers the map, so it's nudged up slightly
  for visibility — a small, honest trade-off, not a big distortion.

## v27.1

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
