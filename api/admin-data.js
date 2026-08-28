// Vercel serverless function — GET /api/admin-data
// ---------------------------------------------------------------
// Returns every row from the signups table, plus a few summary
// counts. Requires a valid session cookie set by api/admin-login.js
// — nobody gets real customer data without having entered the
// correct ADMIN_PASSWORD first. If the cookie is missing, expired,
// or its signature doesn't match, this returns 401 and nothing else.

const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

function verify(secret, token) {
  if (!token) return false;
  var parts = token.split(".");
  if (parts.length !== 2) return false;
  var expiry = parseInt(parts[0], 10);
  var signature = parts[1];
  if (!expiry || Date.now() > expiry) return false;

  var expected = crypto.createHmac("sha256", secret).update("admin:" + expiry).digest("hex");
  var sigBuf = Buffer.from(signature);
  var expBuf = Buffer.from(expected);
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

function getCookie(req, name) {
  var header = req.headers.cookie || "";
  var found = header
    .split(";")
    .map(function (part) {
      return part.trim();
    })
    .find(function (part) {
      return part.indexOf(name + "=") === 0;
    });
  return found ? found.slice(name.length + 1) : null;
}

module.exports = async (req, res) => {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || !process.env.DATABASE_URL) {
    res.status(500).json({ error: "Admin login isn't set up yet." });
    return;
  }

  const token = getCookie(req, "streetside_admin");
  if (!verify(sessionSecret, token)) {
    res.status(401).json({ error: "Not signed in." });
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
    };
    signups.forEach(function (s) {
      var pkg = s.interested_package || "not specified";
      summary.byPackage[pkg] = (summary.byPackage[pkg] || 0) + 1;
    });

    res.status(200).json({ ok: true, summary: summary, signups: signups });
  } catch (err) {
    console.error("[streetside] Admin data fetch failed:", err);
    res.status(500).json({ error: "Failed to load data." });
  }
};
