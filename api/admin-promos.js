// Vercel serverless function — /api/admin-promos   (admin sign-in required)
// ---------------------------------------------------------------
//   GET                         -> every promo code (active and paused)
//   POST {action:"save", ...}   -> add a code, or change an existing one
//   POST {action:"delete", code}-> remove a code
//
// The first time this runs it creates the `promo_codes` table and fills it with
// the starter codes from config/promo-codes.json, so there is nothing to run
// by hand. Uses the same admin session cookie as the signups dashboard.

const { neon } = require("@neondatabase/serverless");
const { verifySession } = require("./_admin-auth");
const { SERVICES, KINDS, normCode, normalize, FALLBACK } = require("./_promo");

const SETUP_SQL =
  "CREATE TABLE IF NOT EXISTS promo_codes (code TEXT PRIMARY KEY, label TEXT, kind TEXT NOT NULL DEFAULT 'percent', amount NUMERIC NOT NULL DEFAULT 0, applies_to TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());";

async function ensureTable(sql) {
  const exists = await sql`SELECT to_regclass('public.promo_codes') AS t`;
  if (exists[0] && exists[0].t) return;
  await sql`
    CREATE TABLE IF NOT EXISTS promo_codes (
      code        TEXT PRIMARY KEY,
      label       TEXT,
      kind        TEXT NOT NULL DEFAULT 'percent',
      amount      NUMERIC NOT NULL DEFAULT 0,
      applies_to  TEXT,
      active      BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT now()
    )
  `;
  for (const raw of FALLBACK) {
    const c = normalize(raw);
    if (!c.code) continue;
    await sql`
      INSERT INTO promo_codes (code, label, kind, amount, applies_to, active)
      VALUES (${c.code}, ${c.label}, ${c.kind}, ${c.amount}, ${c.appliesTo.join(",")}, TRUE)
      ON CONFLICT (code) DO NOTHING
    `;
  }
}

async function listAll(sql) {
  const rows = await sql`SELECT code, label, kind, amount, applies_to, active FROM promo_codes ORDER BY active DESC, code`;
  return rows.map(normalize);
}

module.exports = async (req, res) => {
  if (!verifySession(req)) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Admin login isn't set up yet." });
    return;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  try {
    await ensureTable(sql);
  } catch (err) {
    console.error("[streetside] Could not set up promo_codes:", err);
    res.status(500).json({
      error: "Couldn't create the promo codes table automatically. In Neon's SQL Editor, run: " + SETUP_SQL,
    });
    return;
  }

  try {
    if (req.method === "GET") {
      res.status(200).json({ ok: true, codes: await listAll(sql) });
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};
    const code = normCode(body.code);

    if (body.action === "delete") {
      if (!code) {
        res.status(400).json({ error: "Missing code." });
        return;
      }
      await sql`DELETE FROM promo_codes WHERE code = ${code}`;
      res.status(200).json({ ok: true, codes: await listAll(sql) });
      return;
    }

    if (body.action === "save") {
      if (code.length < 2) {
        res.status(400).json({ error: "A code needs at least 2 letters or numbers." });
        return;
      }
      const kind = KINDS.indexOf(body.kind) !== -1 ? body.kind : null;
      if (!kind) {
        res.status(400).json({ error: "Choose percent off or dollars off." });
        return;
      }
      const amount = Number(body.amount);
      if (!isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: "Enter a discount amount greater than zero." });
        return;
      }
      if (kind === "percent" && amount > 100) {
        res.status(400).json({ error: "A percent discount can't be more than 100." });
        return;
      }
      if (amount > 100000) {
        res.status(400).json({ error: "That amount looks too large." });
        return;
      }
      const appliesTo = (Array.isArray(body.appliesTo) ? body.appliesTo : []).filter(function (s) {
        return SERVICES.indexOf(s) !== -1;
      });
      const label = String(body.label || "").trim().slice(0, 60);
      const active = body.active === undefined ? true : !!body.active;
      await sql`
        INSERT INTO promo_codes (code, label, kind, amount, applies_to, active)
        VALUES (${code}, ${label}, ${kind}, ${amount}, ${appliesTo.join(",")}, ${active})
        ON CONFLICT (code) DO UPDATE
          SET label = EXCLUDED.label, kind = EXCLUDED.kind, amount = EXCLUDED.amount,
              applies_to = EXCLUDED.applies_to, active = EXCLUDED.active
      `;
      res.status(200).json({ ok: true, codes: await listAll(sql) });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    console.error("[streetside] admin-promos failed:", err);
    res.status(500).json({ error: "Something went wrong saving that." });
  }
};
