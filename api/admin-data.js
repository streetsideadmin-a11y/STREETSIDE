// Vercel serverless function — GET /api/admin-data
// ---------------------------------------------------------------
// Returns every row from the signups table, plus a few summary
// counts. Requires a valid session cookie set by api/admin-login.js
// — nobody gets real customer data without having entered the
// correct ADMIN_PASSWORD first. If the cookie is missing, expired,
// or its signature doesn't match, this returns 401 and nothing else.

const { neon } = require("@neondatabase/serverless");
const { verifySession } = require("./_admin-auth");

module.exports = async (req, res) => {
  if (!verifySession(req)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Admin login isn't set up yet." });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const signups = await sql`
      SELECT * FROM signups ORDER BY submitted_at DESC
    `;

    const summary = {
      total: signups.length,
      waitlist: signups.filter(function (s) {
        return s.form_type === "waitlist";
      }).length,
      addressCheck: signups.filter(function (s) {
        return s.form_type === "address-check";
      }).length,
      byPackage: {},
      byCity: {},
    };
    signups.forEach(function (s) {
      var pkg = s.interested_package || "not specified";
      summary.byPackage[pkg] = (summary.byPackage[pkg] || 0) + 1;

      if (s.city) {
        var cityKey = s.city.trim();
        summary.byCity[cityKey] = (summary.byCity[cityKey] || 0) + 1;
      }
    });

    res.status(200).json({ ok: true, summary: summary, signups: signups });
  } catch (err) {
    console.error("[streetside] Admin data fetch failed:", err);
    res.status(500).json({ error: "Failed to load data." });
  }
};
