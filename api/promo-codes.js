// Vercel serverless function — GET /api/promo-codes
// ---------------------------------------------------------------
// Public list of ACTIVE promo codes and what each one takes off, so the
// website can show the discounted price. Codes are managed on the admin page
// (admin-promos.html). Nothing private is returned here.

const { neon } = require("@neondatabase/serverless");
const { loadActiveCodes } = require("./_promo");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
    const codes = await loadActiveCodes(sql);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      codes: codes.map(function (c) {
        return { code: c.code, label: c.label, kind: c.kind, amount: c.amount, appliesTo: c.appliesTo };
      }),
    });
  } catch (err) {
    console.error("[streetside] promo-codes failed:", err);
    res.status(500).json({ error: "Could not load promo codes." });
  }
};
