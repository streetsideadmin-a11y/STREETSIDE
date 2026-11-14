// Shared promo-code helpers for api/promo-codes.js, api/admin-promos.js and
// api/waitlist.js. The leading underscore keeps Vercel from making it a route.
//
// Codes live in the `promo_codes` table (managed on admin-promos.html). If the
// table doesn't exist yet or the database can't be reached, the starter list in
// config/promo-codes.json is used instead, so the site never loses its codes.

const SERVICES = ["bin-valet", "bin-cleaning", "snow-removal"];
const KINDS = ["percent", "dollars"];

let FALLBACK = [];
try {
  FALLBACK = require("../config/promo-codes.json").codes || [];
} catch (e) {
  FALLBACK = [];
}

function normCode(v) {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
}

function toAppliesTo(v) {
  var list = Array.isArray(v) ? v : String(v || "").split(",");
  return list
    .map(function (s) { return String(s).trim(); })
    .filter(function (s) { return SERVICES.indexOf(s) !== -1; });
}

// Accepts a database row or an entry from the starter file.
function normalize(c) {
  var kind = KINDS.indexOf(c.kind) !== -1 ? c.kind : "percent";
  var amount = Number(c.amount);
  return {
    code: normCode(c.code),
    label: String(c.label || "").slice(0, 60),
    kind: kind,
    amount: isFinite(amount) && amount > 0 ? amount : 0,
    appliesTo: toAppliesTo(c.applies_to !== undefined ? c.applies_to : c.appliesTo),
    active: c.active === undefined ? true : !!c.active,
  };
}

function money(n) {
  var f = Number(n).toFixed(2);
  return "$" + (f.slice(-3) === ".00" ? f.slice(0, -3) : f);
}

function describe(c) {
  if (!c.amount) return "no discount set";
  return c.kind === "percent"
    ? c.amount + "% off the first bill"
    : money(c.amount) + " off the first bill";
}

// Active codes only. Falls back to the starter file if the table is missing.
async function loadActiveCodes(sql) {
  if (sql) {
    try {
      var rows = await sql`SELECT code, label, kind, amount, applies_to, active FROM promo_codes WHERE active = TRUE ORDER BY code`;
      return rows.map(normalize);
    } catch (err) {
      /* table missing or database unreachable — use the starter list */
    }
  }
  return FALLBACK.map(normalize);
}

module.exports = { SERVICES, KINDS, normCode, normalize, describe, loadActiveCodes, FALLBACK, toAppliesTo };
