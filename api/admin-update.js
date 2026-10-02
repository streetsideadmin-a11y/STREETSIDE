// Vercel serverless function — POST /api/admin-update
// ---------------------------------------------------------------
// Updates fields on one signup row that only Streetside staff set
// from the admin dashboard — currently the "contacted" flag and the
// discount type (Founder / Friends & Family / Free Service). Requires
// a valid admin session (see api/_admin-auth.js) — same protection
// as api/admin-data.js.
//
// A request can include either or both fields; only the ones present
// get updated, so the two controls in admin.html (the "Contacted"
// checkbox and the discount dropdown) can each save independently
// without clobbering the other.

const { neon } = require("@neondatabase/serverless");
const { verifySession } = require("./_admin-auth");

const VALID_DISCOUNT_TYPES = ["founder", "friends-family", "free-service"];

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

  const hasContacted = Object.prototype.hasOwnProperty.call(body, "contacted");
  const hasDiscountType = Object.prototype.hasOwnProperty.call(body, "discountType");

  if (!hasContacted && !hasDiscountType) {
    res.status(400).json({ error: "Nothing to update." });
    return;
  }

  // Empty string means "clear the discount" (the admin picked "—
  // None —"); anything else must be one of the real discount codes,
  // never trusted as free-form text from the client.
  if (hasDiscountType && body.discountType && !VALID_DISCOUNT_TYPES.includes(body.discountType)) {
    res.status(400).json({ error: "Unrecognized discount type." });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (hasContacted) {
      await sql`UPDATE signups SET contacted = ${!!body.contacted} WHERE id = ${id}`;
    }

    if (hasDiscountType) {
      const discountType = body.discountType || null;
      try {
        await sql`UPDATE signups SET discount_type = ${discountType} WHERE id = ${id}`;
      } catch (discountErr) {
        // The discount_type column is a newer addition (see the
        // migration in schema.sql) — if it hasn't been run yet on
        // this database, say so clearly instead of a generic 500.
        if (discountErr && discountErr.code === "42703") {
          res.status(409).json({
            error:
              "The 'discount_type' column doesn't exist yet in your database — run the migration in schema.sql (ALTER TABLE signups ADD COLUMN IF NOT EXISTS discount_type TEXT;), then try again.",
          });
          return;
        }
        throw discountErr;
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[streetside] Admin update failed:", err);
    res.status(500).json({ error: "Failed to update." });
  }
};
