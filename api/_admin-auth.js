// Shared by api/admin-data.js, api/admin-update.js, and
// api/admin-delete.js — one place that decides whether a request has
// a valid admin session, so all three endpoints enforce it identically.
// The leading underscore keeps Vercel from turning this into its own
// route; it's a plain module, not an endpoint.

const crypto = require("crypto");

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

function verifySession(req) {
  var secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  var token = getCookie(req, "streetside_admin");
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

module.exports = { verifySession: verifySession };
