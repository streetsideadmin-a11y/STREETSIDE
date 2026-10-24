// Vercel serverless function — GET /api/town-boundary?town=<name>
// ---------------------------------------------------------------
// Returns a real municipal boundary shape for one town, from a
// shared cache — not a live lookup on every request. The first time
// any visitor (public site or admin dashboard) asks for a given
// town, this fetches it once from OpenStreetMap's free Nominatim
// service and saves the result (even a "not found" result) to the
// database. Every request after that — from anyone, forever — is
// served straight from that cache.
//
// This matters because the public map could be viewed by any number
// of visitors at once. Calling Nominatim directly from the browser
// for every single one (the way the admin dashboard's rate-limited
// queue does, which is fine for one person's occasional use) would
// multiply real requests to a free, policy-limited service far past
// what's reasonable. Routing every request through this cache keeps
// total real Nominatim usage at "once per town, ever," regardless of
// how much traffic the site gets.
//
// Response shape: { town: "lancaster", geojson: {...} | null }

const { neon } = require("@neondatabase/serverless");

// Cached rows saved before this moment are treated as stale and
// looked up again (once), because the old lookup took whatever
// Nominatim ranked first — which for towns that share a name with
// townships elsewhere in Ohio (Amanda, Walnut, Lancaster...) could be
// the wrong place entirely, or a "not found" caused by a temporary
// failure. Bump this date any time the lookup logic changes again.
const CACHE_EPOCH = new Date("2026-10-23T00:00:00Z");

// How far (in degrees, roughly 20 miles) a boundary is allowed to
// stretch from the town's known coordinates before it's rejected as
// the wrong place or an oversized county/township shape.
const MAX_SPAN_DEGREES = 0.35;

function parseHint(req) {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  // Only trust a hint that's actually inside Ohio-ish bounds.
  if (isFinite(lat) && isFinite(lng) && lat > 38 && lat < 42.5 && lng > -85 && lng < -80) {
    return { lat, lng };
  }
  return null;
}

function geometryBounds(geometry) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  (function walk(c) {
    if (typeof c[0] === "number") {
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
      if (c[0] < minLng) minLng = c[0];
      if (c[0] > maxLng) maxLng = c[0];
    } else {
      c.forEach(walk);
    }
  })(geometry.coordinates);
  return { minLat, maxLat, minLng, maxLng };
}

// Picks the best polygon from Nominatim's results: must be a real
// area shape, and — when we know where the town actually is — must
// sit around that spot and not be absurdly large.
function pickBoundary(results, hint) {
  const polygons = results.filter(function (r) {
    return r.geojson && (r.geojson.type === "Polygon" || r.geojson.type === "MultiPolygon");
  });
  const ok = polygons.filter(function (r) {
    if (!hint) return true;
    const b = geometryBounds(r.geojson);
    const containsHint = hint.lat >= b.minLat - 0.02 && hint.lat <= b.maxLat + 0.02 &&
      hint.lng >= b.minLng - 0.02 && hint.lng <= b.maxLng + 0.02;
    const small = (b.maxLat - b.minLat) <= MAX_SPAN_DEGREES && (b.maxLng - b.minLng) <= MAX_SPAN_DEGREES;
    return containsHint && small;
  });
  // Prefer actual settlements over generic administrative areas.
  const settlement = ok.find(function (r) {
    return r.class === "boundary" || r.class === "place";
  });
  return (settlement || ok[0] || {}).geojson || null;
}

async function lookupBoundary(town, hint) {
  const name = town.replace(/\b\w/g, (c) => c.toUpperCase());
  const headers = { "User-Agent": "StreetsideOH-Website/1.0 (streetsideoh.com)" };
  const base = "https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&limit=10&q=";

  const urls = [];
  if (hint) {
    const d = 0.25;
    const viewbox = [hint.lng - d, hint.lat + d, hint.lng + d, hint.lat - d].join(",");
    urls.push(base + encodeURIComponent(name + ", Ohio, USA") + "&viewbox=" + viewbox + "&bounded=1");
  }
  urls.push(base + encodeURIComponent(name + ", Ohio, USA"));

  // definitive = Nominatim actually answered, so "no polygon" is a
  // real answer worth remembering; a network error is not.
  let definitive = false;
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;
      definitive = true;
      const geojson = pickBoundary(await response.json(), hint);
      if (geojson) return { geojson, definitive: true };
    } catch (err) {
      console.warn("[streetside] Nominatim request failed for " + town + ":", err);
    }
  }
  return { geojson: null, definitive };
}

module.exports = async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Server is not configured yet." });
    return;
  }

  const town = (req.query.town || "").toLowerCase().trim();
  if (!town) {
    res.status(400).json({ error: "Missing town parameter." });
    return;
  }
  const hint = parseHint(req);

  const sql = neon(process.env.DATABASE_URL);

  try {
    const cached = await sql`SELECT geojson, fetched_at FROM town_boundaries WHERE town = ${town}`;
    if (cached.length > 0 && new Date(cached[0].fetched_at) >= CACHE_EPOCH) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.status(200).json({ town, geojson: cached[0].geojson });
      return;
    }
  } catch (err) {
    console.error("[streetside] Boundary cache lookup failed:", err);
    res.status(500).json({ error: "Could not check the boundary cache." });
    return;
  }

  // Not cached (or cached by the older, less careful lookup) — look
  // it up once against the real service and remember the answer.
  const result = await lookupBoundary(town, hint);

  if (result.definitive) {
    try {
      await sql`
        INSERT INTO town_boundaries (town, geojson, fetched_at)
        VALUES (${town}, ${result.geojson}, now())
        ON CONFLICT (town) DO UPDATE SET geojson = EXCLUDED.geojson, fetched_at = now()
      `;
    } catch (err) {
      console.error("[streetside] Could not save boundary to cache:", err);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
  } else {
    // Nominatim was unreachable — don't remember "nothing found",
    // so the next visit simply tries again.
    res.setHeader("Cache-Control", "no-store");
  }
  res.status(200).json({ town, geojson: result.geojson });
};
