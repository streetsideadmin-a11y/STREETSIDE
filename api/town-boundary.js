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

  const sql = neon(process.env.DATABASE_URL);

  try {
    const cached = await sql`SELECT geojson FROM town_boundaries WHERE town = ${town}`;
    if (cached.length > 0) {
      res.setHeader("Cache-Control", "public, max-age=86400"); // also cache in the browser/CDN for a day
      res.status(200).json({ town, geojson: cached[0].geojson });
      return;
    }
  } catch (err) {
    console.error("[streetside] Boundary cache lookup failed:", err);
    res.status(500).json({ error: "Could not check the boundary cache." });
    return;
  }

  // Not cached yet — this is the ONE time this town will ever be
  // looked up against the real service, no matter how many more
  // requests for it come in after this.
  let geojson = null;
  try {
    const query = town.replace(/\b\w/g, (c) => c.toUpperCase()) + ", Ohio, USA";
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&limit=1&q=" +
      encodeURIComponent(query);
    // Nominatim's usage policy asks for a valid identifying User-Agent
    // on server-side requests (a browser's automatic Referer covers
    // this for client-side calls, but this call comes from our own
    // server, so it needs to identify itself explicitly).
    const response = await fetch(url, {
      headers: { "User-Agent": "StreetsideOH-Website/1.0 (streetsideoh.com)" },
    });
    if (response.ok) {
      const results = await response.json();
      if (results.length && results[0].geojson) {
        const type = results[0].geojson.type;
        if (type === "Polygon" || type === "MultiPolygon") {
          geojson = results[0].geojson;
        }
      }
    }
  } catch (err) {
    console.warn("[streetside] Could not fetch a boundary for " + town + " from Nominatim:", err);
    // geojson stays null — still cache that outcome below, so we
    // don't keep retrying a town that genuinely has no match.
  }

  try {
    await sql`
      INSERT INTO town_boundaries (town, geojson)
      VALUES (${town}, ${geojson})
      ON CONFLICT (town) DO NOTHING
    `;
  } catch (err) {
    console.error("[streetside] Could not save boundary to cache:", err);
    // Not fatal — still return the result below even if caching failed.
  }

  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).json({ town, geojson });
};
