// Vercel serverless function — GET /api/neighbor-count
// ---------------------------------------------------------------
// Returns { count: <real number of waitlist signups> } straight from
// the database. scripts/counter.js already knows how to call this —
// just flip neighborCounter.source to "api" in config/site-config.js
// once this is deployed and working (see README.md).

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
      SELECT COUNT(*)::int AS count
      FROM signups
      WHERE form_type = 'waitlist'
    `;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ count: rows[0].count });
  } catch (err) {
    console.error("[streetside] Failed to load neighbor count:", err);
    res.status(500).json({ error: "Could not load neighbor count." });
  }
};
