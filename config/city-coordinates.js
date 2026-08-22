/**
 * STREETSIDE — CITY COORDINATES
 * ---------------------------------------------------------------
 * Maps a city/town name (as typed into the waitlist or address-check
 * form) to a general [latitude, longitude] pair, so the service-area
 * map can drop a pin there. This is intentionally NOT precise
 * geocoding of anyone's street address — just enough to place a
 * marker near the town center for privacy.
 *
 * Matching is case-insensitive and trims whitespace (see
 * scripts/interest-map.js). If someone's city isn't in this list,
 * their signup still counts everywhere else on the site (the
 * waitlist, the neighbor counter, the database) — it just won't get
 * a pin until you add it here. That's a display gap only, never a
 * lost signup.
 *
 * To add a new town: add one line in the same format. You can find
 * a town's coordinates by searching "<town name> Ohio coordinates"
 * or looking it up on Google Maps (right-click the location ->
 * the lat/lng shown is what you want).
 */

window.STREETSIDE_CITY_COORDS = {
  "lancaster": [39.7134, -82.5993],
  "logan": [39.5395, -82.4085],
  "nelsonville": [39.4567, -82.2321],
  "athens": [39.3292, -82.1013],
  "chillicothe": [39.3334, -82.9824],
  "zanesville": [39.9400, -82.0132],
  "cambridge": [40.0287, -81.5854],
  "marietta": [39.4145, -81.4548],
  "gallipolis": [38.8087, -82.2007],
  "portsmouth": [38.7314, -82.9271],
  "new lexington": [39.7020, -82.2085],
  "circleville": [39.6001, -82.9463],
  "pickerington": [39.8892, -82.7565],
  "baltimore": [39.8481, -82.6032],
  "canal winchester": [39.8395, -82.8010],
  "somerset": [39.8098, -82.2985],
  "thornville": [39.8973, -82.4551],
  "hebron": [39.9645, -82.5232],
};
