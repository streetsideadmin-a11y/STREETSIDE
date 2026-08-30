# Changelog

Version numbers correspond to each delivered zip/package, starting
at v25.0. Not tied to git commits — just a simple way to keep track
of which round of changes you're looking at.

## v38.1 — current

Real bug fix: the public map's neighbor counts weren't combining
correctly.

- The API groups signups by the *exact* text someone typed as their
  city, so "Lancaster" and "Lancaster, OH" came back as two separate
  entries even though they're the same real town. The map then drew
  each one separately instead of combining them — showing a partial,
  incorrect count (and likely overlapping circles) rather than the
  true total.
- Fixed by re-combining entries by the actual town they match
  *before* drawing anything, so every real spelling of a town's name
  contributes to one correct total. Verified directly: fed in three
  different spellings of "Lancaster" with counts of 3, 2, and 1, and
  confirmed it now draws exactly one circle showing "6 neighbors
  interested" — the true sum — instead of three separate partial
  circles.
- The admin dashboard was never affected by this — it already
  counted from individual raw signups directly rather than from
  pre-grouped data, so it didn't have this bug.

## v38.0

- Public map now shows **real municipal boundaries** for towns with
  interest (same idea as the admin map) instead of just circles,
  using **normal map colors** (removed the dark CSS filter), with
  **scroll-wheel zoom enabled** so visitors can zoom into their own
  neighborhood directly.
- Built a proper **shared boundary cache** (`api/town-boundary.js` +
  a new `town_boundaries` table) rather than having every visitor's
  browser call the free Nominatim service directly — a real concern
  once a page any number of people could load at once is involved.
  Each town is looked up against the real service **at most once,
  ever**, no matter how much traffic the site gets; every request
  after that is served from the cache. Verified this guarantee
  directly with a logic test simulating 7 requests across 2 towns
  and confirming only 2 real lookups ever happened.
- The admin dashboard's map was switched to use this same shared
  cache too — same accuracy, but boundaries now load instantly for
  any town someone's already looked up before, instead of the old
  one-second-per-town rate limit that was only there because it was
  calling the real service directly.
- **New setup step**: one more line in the Neon SQL migration (the
  new `town_boundaries` table) — see the README's admin setup
  section.
- Verified all three changes together with a stubbed test: scroll
  zoom on, no dark-filter class applied, the dark-filter CSS rule
  itself confirmed removed from the stylesheet, and a real boundary
  correctly rendering through the new cache endpoint.

## v37.0

- Public map switched back to the real Leaflet/OpenStreetMap
  approach (same technical base as the admin map), read-only this
  time — no click-to-filter, no live boundary lookups, just heat
  circles at real, accurate positions.
- Verified directly that it's genuinely read-only: confirmed with a
  stubbed test that no click handler gets registered on the public
  map's circles at all, unlike the admin map's.
- Updated the README's map documentation to reflect the current
  setup and stop pointing at outdated reasoning from a version that
  no longer exists — the full back-and-forth (illustrated → real
  map → illustrated with a fixed projection bug → real map again)
  is preserved in this changelog's history below if useful context.
- Same tradeoff as before, worth restating since it flip-flopped
  twice: this page now depends on OpenStreetMap's tiles being
  reachable, unlike a fully self-contained illustration.

## v36.0

Reverted the public map back to a self-contained illustration —
this time with the actual root cause of the position drift fixed:

- **Found and fixed the real bug**: the projection math never
  accounted for the fact that a degree of longitude covers fewer
  real-world miles than a degree of latitude at this latitude
  (~23% less) — every previous "recentering" was working around a
  map that was fundamentally squeezed into the wrong aspect ratio,
  not actually broken town data. This version computes the correct
  real-world aspect ratio first, then projects everything through
  that — the actual fix, not another recenter.
- Back to zero external dependencies on the public page — the
  Leaflet/OpenStreetMap version from the last two updates is gone;
  this page can't break for a visitor if a map provider has an
  outage, same as the original design intent.
- All 45 towns, all 7 traced roads, the real Buckeye Lake outline,
  and the heatmap behavior are unchanged apart from being
  reprojected through the corrected math — verified the heatmap
  still activates and scales correctly with test data.
- The admin dashboard's map is unaffected by any of this — it still
  uses Leaflet/OpenStreetMap intentionally, since that tradeoff
  makes sense for an internal tool in a way it didn't for this page.

## v35.0

Replaced the public service-area map's whole approach:

- **Now a real map** (Leaflet + OpenStreetMap, same setup as the
  admin map) instead of a hand-illustrated one — fixes the position
  drift that kept coming back no matter how carefully the old
  custom projection was recentered, since positions now come from
  a real map projection instead of an approximation.
- Real roads and the real Buckeye Lake shape now come from the map
  tiles automatically — no more hand-tracing from reference
  screenshots, and no risk of that tracing being slightly off.
- Darkened with a CSS filter to match the brand's dark green look,
  rather than a separate dark-tile provider — CARTO's free dark
  tiles now require an API key signup (a recent policy change), so
  this avoids that account/key requirement entirely.
- Removed a large amount of now-obsolete hand-traced SVG code (all
  the road paths, the lake outline, the custom projection math).
- **One tradeoff, stated directly in the README**: this page now
  depends on OpenStreetMap's tiles being reachable, which the old
  self-contained illustration didn't. That's a deliberate choice
  given how much the old approach kept drifting — worth flagging
  since it reverses an earlier documented decision to keep this
  page dependency-free for reliability.
- Verified the underlying logic directly (since my own sandbox
  can't reach the external map tiles to see it visually): correct
  tile URL and attribution, the dark-skin CSS class applied, and
  the exact right number of city dots/heat circles/labels for a
  test data set — all confirmed via a stubbed Leaflet API, same
  method already used to verify the admin map.

## v34.0

- Clicking a town on the Waitlist Interest Map now filters the
  route-planning table below it down to just that town — works on
  both a real boundary shape and the circle fallback.
- Uses the same town-matching the map already uses to count
  signups, not a plain exact-text match — so it correctly catches
  every way a customer's city got typed for the same real town
  (e.g. "Lancaster" and "Lancaster, OH" both count), rather than
  only filtering one specific spelling and missing the rest.
- Added a clear "Filtered by map: [Town]" banner with its own Clear
  button when a map filter is active; the main filter row's Clear
  button resets this too, so there's no way to get stuck in a
  filtered state without an obvious way out.
- Verified directly: clicking a town filters correctly, clicking
  Lancaster specifically catches both spelling variants in the test
  data, and the indicator/count both update and reset correctly.

## v33.1

- Replaced the "show a circle immediately" placeholder with a real
  loading state: each town with interest now shows a small pulsing
  marker while its boundary is being looked up, swapped for the
  real boundary shape (or a fallback circle, only if that specific
  town's boundary genuinely can't be found) once the lookup
  resolves — no more guessing with a circle before we even know if
  a real boundary exists.
- Added a "Loading real boundaries… (X left)" status line above the
  map that tracks progress and disappears once everything's loaded.
- Verified the full sequence with simulated data: loading markers
  appear immediately with zero premature circles, the status text
  updates as requests resolve, a found boundary and a not-found
  fallback circle both land correctly, and every loading marker
  gets cleanly removed once its town resolves either way.

## v33.0

- Waitlist Interest Map now highlights each town's **real municipal
  boundary** (traced from OpenStreetMap's own boundary data via
  Nominatim, their free geocoding service) instead of a generic
  circle, wherever a real boundary exists to find.
- Only fetches boundaries for towns that currently have real
  waitlist interest — not all 45 towns preemptively — and loads
  them one at a time, about a second apart, to respect Nominatim's
  free-tier usage policy rather than hammering it with a burst of
  parallel requests.
- Shows a circle immediately for every interested town, then swaps
  in the real boundary shape once it loads — so the map is useful
  right away instead of sitting blank while boundaries load.
- Graceful fallback: any town whose real boundary can't be found
  (or if the request fails) just keeps its circle — nothing breaks
  or looks empty.
- Verified the whole flow directly: circles appear instantly for
  every town with interest, a found boundary correctly swaps in
  and removes its placeholder circle, a not-found town correctly
  keeps its circle, and the delay between requests lands right at
  the intended ~1.1 seconds.
- I couldn't pre-fetch and bundle this data myself ahead of time
  (my own tools require a URL to come from a search result before
  I can fetch it, so I can't hit a geocoding API directly) — that's
  why this fetches live in the browser instead of using baked-in
  data, which is also more honest anyway: boundaries stay live and
  current rather than a snapshot from whenever I fetched them.

## v32.0

- Waitlist Interest Map now uses a real interactive map (Leaflet +
  OpenStreetMap) instead of the stylized illustrated map — actual
  roads and geography, real pan/zoom, no API key needed. Deliberate
  difference from the public map, which avoids any external map
  dependency on purpose (see README for why); that tradeoff doesn't
  apply the same way to an internal admin-only tool.
- Heat circles use real-world meter radius, so they scale correctly
  as you zoom in or out rather than staying a fixed pixel size.
- Caught and fixed a real syntax bug from the previous rewrite (a
  stray extra closing brace) that would have broken the entire
  admin page's JavaScript — found it by syntax-checking the
  extracted script directly, not just visually.
- Verified all the underlying logic is correct by stubbing
  Leaflet's API and confirming: exactly 45 town reference markers,
  the OSM tile layer initialized once with correct attribution, and
  heat circles that correctly exclude address-check submissions
  (confirmed via the exact radius and tooltip text produced).
- Note: couldn't visually confirm the real map tiles rendering in
  this sandbox specifically, since it blocks the external CDN/tile
  requests — that's a restriction of my working environment, not
  something wrong with the code. Worth a quick look once this is
  live to confirm the tiles load as expected.

## v31.1

Simplified the admin map based on feedback — dropped the lasso/pin
selection idea, made it a bigger reference heatmap instead:

- Removed the click-to-select and drag-a-lasso interaction entirely
  — the map is now purely a visual reference, not a selection tool.
  Selecting stops for the route still works the same as before, via
  the checkboxes in the table.
- Map is bigger (900×600 viewBox, up from 700×460) and now renders
  as a heatmap — same color/size scale as the public map (warmer,
  bigger glow = more interest) — instead of individual pins.
- **Only counts real waitlist signups, not address-check lookups**
  — verified directly: a town with 2 address-checks and 1 real
  waitlist signup correctly shows the same small/light glow as a
  town with only 1 real signup, not inflated by the address-checks.
- Cleaned up now-dead code from the removed lasso feature.

## v31.0

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
