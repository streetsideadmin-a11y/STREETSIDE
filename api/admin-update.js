// Vercel serverless function — POST /api/admin-update
// ---------------------------------------------------------------
// Updates the "contacted" flag on one signup row. Requires a valid
// admin session (see api/_admin-auth.js) — same protection as
// api/admin-data.js.

const { neon } = require("@neondatabase/serverless");
const { verifySession } = require("./_admin-auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!verifySession(req)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Admin login isn't set up yet." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      body = {};
    }
  }
  body = body || {};

  const id = parseInt(body.id, 10);
  if (!id) {
    res.status(400).json({ error: "Missing or invalid id." });
    return;
  }
  const contacted = !!body.contacted;

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`UPDATE signups SET contacted = ${contacted} WHERE id = ${id}`;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[streetside] Admin update failed:", err);
    res.status(500).json({ error: "Failed to update." });
  }
};
