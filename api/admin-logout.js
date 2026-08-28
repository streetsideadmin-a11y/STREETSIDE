// Vercel serverless function — POST /api/admin-logout
// ---------------------------------------------------------------
// Clears the admin session cookie by setting it with Max-Age=0.

module.exports = async (req, res) => {
  res.setHeader(
    "Set-Cookie",
    "streetside_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  res.status(200).json({ ok: true });
};
