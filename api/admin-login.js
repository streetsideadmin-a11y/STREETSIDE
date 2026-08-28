// Vercel serverless function — POST /api/admin-login
// ---------------------------------------------------------------
// Checks a submitted password against ADMIN_PASSWORD (an env var
// you set in Vercel — see README.md). On success, issues a signed,
// HttpOnly session cookie good for 12 hours; api/admin-data.js
// checks that cookie before returning any real customer data.
//
// The password is never stored in code or in the database — only
// in your Vercel project's environment variables, same way
// DATABASE_URL already works.

const crypto = require("crypto");

function sign(secret, expiry) {
  return crypto.createHmac("sha256", secret).update("admin:" + expiry).digest("hex");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    console.error(
      "[streetside] Admin login isn't configured — set ADMIN_PASSWORD and SESSION_SECRET in Vercel. See README.md."
    );
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

  const submitted = String(body.password || "");
  const expected = String(adminPassword);

  // Constant-time comparison — a plain === would leak how many
  // characters matched via how long the response takes, which is a
  // real (if minor) attack vector for a brute-force attempt.
  const submittedBuf = Buffer.from(submitted);
  const expectedBuf = Buffer.from(expected);
  const isMatch =
    submittedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(submittedBuf, expectedBuf);

  if (!isMatch) {
    // Small artificial delay to slow down automated guessing —
    // not a substitute for a real rate limiter, but better than
    // nothing for a low-traffic admin panel.
    await new Promise((resolve) => setTimeout(resolve, 400));
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const expiry = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const token = expiry + "." + sign(sessionSecret, expiry);

  res.setHeader(
    "Set-Cookie",
    "streetside_admin=" +
      token +
      "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" +
      60 * 60 * 12
  );
  res.status(200).json({ ok: true });
};
