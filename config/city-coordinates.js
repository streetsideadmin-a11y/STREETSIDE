/**
 * STREETSIDE — CITY COORDINATES
 * ---------------------------------------------------------------
 * Maps a city/town name (as typed into the waitlist or address-check
 * form) to a general location, so the service-area map can drop a
 * pin there. This is intentionally NOT precise geocoding of anyone's
 * street address — just enough to place a marker near the town
 * center for privacy.
 *
 * Each entry has:
 *   - coords: [latitude, longitude]
 *   - tier: "city" (larger base pin) or "town" (smaller base pin) —
 *     purely a visual size so bigger, more established cities read
 *     as more prominent on the map than small villages, regardless
 *     of signup count. Actual interest (signup count) still adds to
 *     the size on top of this base — see scripts/interest-map.js.
 *
 * Matching is case-insensitive and trims whitespace. If someone's
 * city isn't in this list, their signup still counts everywhere
 * else on the site (the waitlist, the neighbor counter, the
 * database) — it just won't get a pin until you add it here. That's
 * a display gap only, never a lost signup.
 *
 * To add a new town: add one line in the same format. You can find
 * a town's coordinates by searching "<town name> Ohio coordinates"
 * or looking it up on Google Maps (right-click the location ->
 * the lat/lng shown is what you want).
 */

window.STREETSIDE_CITY_COORDS = {
  // ---- Cities (larger base pin) ----
  "lancaster": { coords: [39.7134, -82.5993], tier: "city" },
  "logan": { coords: [39.5395, -82.4085], tier: "city" },
  "nelsonville": { coords: [39.4567, -82.2321], tier: "city" },
  "athens": { coords: [39.3292, -82.1013], tier: "city" },
  "chillicothe": { coords: [39.3334, -82.9824], tier: "city" },
  "zanesville": { coords: [39.9400, -82.0132], tier: "city" },
  "cambridge": { coords: [40.0287, -81.5854], tier: "city" },
  "marietta": { coords: [39.4145, -81.4548], tier: "city" },
  "gallipolis": { coords: [38.8087, -82.2007], tier: "city" },
  "portsmouth": { coords: [38.7314, -82.9271], tier: "city" },
  "circleville": { coords: [39.6001, -82.9463], tier: "city" },
  "pickerington": { coords: [39.8892, -82.7565], tier: "city" },

  // ---- Smaller towns (smaller base pin) ----
  "new lexington": { coords: [39.7020, -82.2085], tier: "town" },
  "baltimore": { coords: [39.8481, -82.6032], tier: "town" },
  "canal winchester": { coords: [39.8395, -82.8010], tier: "town" },
  "somerset": { coords: [39.8098, -82.2985], tier: "town" },
  "thornville": { coords: [39.8973, -82.4551], tier: "town" },
  "hebron": { coords: [39.9645, -82.5232], tier: "town" },

  // ---- Smaller towns filling the gaps between the above ----
  "amanda": { coords: [39.6373, -82.7315], tier: "town" },
  "bremen": { coords: [39.7040, -82.4290], tier: "town" },
  "rushville": { coords: [39.7529, -82.4426], tier: "town" },
  "junction city": { coords: [39.7415, -82.2965], tier: "town" },
  "glouster": { coords: [39.5087, -82.0821], tier: "town" },
  "buchtel": { coords: [39.4429, -82.1657], tier: "town" },
  "corning": { coords: [39.6013, -82.1735], tier: "town" },
  "shawnee": { coords: [39.6034, -82.2216], tier: "town" },
  "new straitsville": { coords: [39.5651, -82.2532], tier: "town" },
  "crooksville": { coords: [39.7615, -82.0993], tier: "town" },
  "roseville": { coords: [39.8129, -82.0765], tier: "town" },
  "millersport": { coords: [39.8934, -82.5385], tier: "town" },
  "buckeye lake": { coords: [39.9276, -82.4835], tier: "town" },
  "glenford": { coords: [39.8534, -82.3488], tier: "town" },
  "sugar grove": { coords: [39.6743, -82.5824], tier: "town" },
  "kirkersville": { coords: [39.9779, -82.6432], tier: "town" },
};
