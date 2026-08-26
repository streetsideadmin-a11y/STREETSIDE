# Changelog

Version numbers correspond to each delivered zip/package, starting
at v25.0. Not tied to git commits — just a simple way to keep track
of which round of changes you're looking at.

## v25.0 — current

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
