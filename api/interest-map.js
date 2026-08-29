// Vercel serverless function — GET /api/interest-map
// ---------------------------------------------------------------
// Returns interest grouped by CITY only — never individual street
// addresses — so the map can show a general pin per town without
// exposing anyone's exact location.
//
// Only counts real waitlist signups, not address-check lookups.
// Address-check is a reference tool for someone checking whether
// service already exists near them against data already collected —
// it isn't itself a new signal of demand, so it shouldn't move the
// map's heat intensity. Someone could otherwise nudge a town's
// "interest" up just by repeatedly checking addresses there.
//
// Response shape: { cities: [{ city: "Lancaster", count: 4 }, ...] }

const { neon } = require("@neondatabase/serverless");

module.exports = async (req, res) => {
  if (!process.env.DATABASE_URL) {
    console.error("[streetside] DATABASE_URL is not set — see README.md.");
    res.status(500).json({ error: "Server is not configured yet." });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT city, COUNT(*)::int AS count
      FROM signups
      WHERE form_type = 'waitlist' AND city IS NOT NULL AND btrim(city) <> ''
      GROUP BY city
      ORDER BY count DESC
    `;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ cities: rows });
  } catch (err) {
    console.error("[streetside] Failed to load interest map data:", err);
    res.status(500).json({ error: "Could not load interest map data." });
  }
};
