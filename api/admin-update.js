// Vercel serverless function — POST /api/admin-update
// ---------------------------------------------------------------
// Updates fields on one signup row that only Streetside staff set
// from the admin dashboard — the "contacted" flag, the discount type,
// full edits of a request's details (body.fields), and adding a request
// by hand (body.create). Requires
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
const VALID_PACKAGES = ["curb", "full", "one-time", "not-sure"];
const VALID_SERVICES = ["bin-valet", "bin-cleaning", "snow-removal"];

// Full-record edits (the Edit / Add request window on the admin page).
// Every value is cleaned up here; nothing from the browser is trusted.
function text(v, max) {
  if (v === undefined || v === null) return null;
  const t = String(v).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max || 200);
  return t === "" ? null : t;
}
function count(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 && n <= 99 ? n : null;
}
function cleanFields(f) {
  f = f || {};
  const services = (Array.isArray(f.services) ? f.services : [])
    .filter((x) => VALID_SERVICES.includes(x))
    .filter((x, i, a) => a.indexOf(x) === i);
  const pkg = VALID_PACKAGES.includes(f.package) ? f.package : null;
  return {
    firstName: text(f.firstName, 80),
    lastName: text(f.lastName, 80),
    email: text(f.email, 200),
    phone: text(f.phone, 40),
    street: text(f.street, 200),
    city: text(f.city, 100),
    zip: text(f.zip, 12),
    collectionDay: text(f.collectionDay, 40),
    wasteProvider: text(f.wasteProvider, 100),
    trashBins: count(f.trashBins),
    recyclingBins: count(f.recyclingBins),
    binStorage: text(f.binStorage, 200),
    services: services.length ? services.join(",") : null,
    package: services.includes("bin-valet") ? pkg : null,
    valetEstimate: text(f.valetEstimate, 200),
    snowSize: text(f.snowSize, 200),
    promoCode: text(f.promoCode, 40) ? text(f.promoCode, 40).toUpperCase() : null,
    discountType: VALID_DISCOUNT_TYPES.includes(f.discountType) ? f.discountType : null,
    notes: text(f.notes, 2000),
    consent: !!f.consent,
    contacted: !!f.contacted,
  };
}

// Columns added after the first launch. If the database doesn't have one
// yet, we add it for you (admin_notes) or explain what to run.
async function setNewerColumns(sql, id, v) {
  const steps = [
    ["services_interested", () => sql`UPDATE signups SET services_interested = ${v.services} WHERE id = ${id}`],
    ["valet_estimate", () => sql`UPDATE signups SET valet_estimate = ${v.valetEstimate} WHERE id = ${id}`],
    ["snow_property_size", () => sql`UPDATE signups SET snow_property_size = ${v.snowSize} WHERE id = ${id}`],
    ["promo_code", () => sql`UPDATE signups SET promo_code = ${v.promoCode} WHERE id = ${id}`],
    ["discount_type", () => sql`UPDATE signups SET discount_type = ${v.discountType} WHERE id = ${id}`],
    ["admin_notes", () => sql`UPDATE signups SET admin_notes = ${v.notes} WHERE id = ${id}`],
  ];
  for (const [col, run] of steps) {
    try {
      await run();
    } catch (err) {
      if (err && err.code === "42703") {
        if (col === "admin_notes") {
          await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS admin_notes TEXT`;
          await run();
        } else {
          const e = new Error("missing column " + col);
          e.missingColumn = col;
          throw e;
        }
      } else {
        throw err;
      }
    }
  }
}

function missingColumnMessage(col) {
  return (
    "The '" + col + "' column doesn't exist yet in your database. Run this in Neon's SQL Editor, then try again: " +
    "ALTER TABLE signups ADD COLUMN IF NOT EXISTS " + col + " TEXT;"
  );
}

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

  // --- Add a request by hand (e.g. someone phoned in) ---------------
  if (body.create) {
    const v = cleanFields(body.fields);
    if (!v.firstName && !v.lastName && !v.phone && !v.email) {
      res.status(400).json({ error: "Add at least a name, phone or email." });
      return;
    }
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`
        INSERT INTO signups (form_type, first_name, last_name, email, phone, street_address, city, zip,
          collection_day, waste_provider, trash_bin_count, recycling_bin_count, bin_storage_location,
          interested_package, consent, contacted)
        VALUES ('waitlist', ${v.firstName}, ${v.lastName}, ${v.email}, ${v.phone}, ${v.street}, ${v.city}, ${v.zip},
          ${v.collectionDay}, ${v.wasteProvider}, ${v.trashBins}, ${v.recyclingBins}, ${v.binStorage},
          ${v.package}, ${v.consent}, ${v.contacted})
        RETURNING id`;
      const newId = rows && rows[0] && rows[0].id;
      if (newId) await setNewerColumns(sql, newId, v);
      res.status(200).json({ ok: true, id: newId });
    } catch (err) {
      if (err && err.missingColumn) {
        res.status(409).json({ error: missingColumnMessage(err.missingColumn) });
        return;
      }
      console.error("[streetside] Admin create failed:", err);
      res.status(500).json({ error: "Failed to add." });
    }
    return;
  }

  const id = parseInt(body.id, 10);
  if (!id) {
    res.status(400).json({ error: "Missing or invalid id." });
    return;
  }

  // --- Edit every detail of one request ------------------------------
  if (body.fields) {
    const v = cleanFields(body.fields);
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`
        UPDATE signups SET
          first_name = ${v.firstName}, last_name = ${v.lastName}, email = ${v.email}, phone = ${v.phone},
          street_address = ${v.street}, city = ${v.city}, zip = ${v.zip},
          collection_day = ${v.collectionDay}, waste_provider = ${v.wasteProvider},
          trash_bin_count = ${v.trashBins}, recycling_bin_count = ${v.recyclingBins},
          bin_storage_location = ${v.binStorage}, interested_package = ${v.package},
          consent = ${v.consent}, contacted = ${v.contacted}
        WHERE id = ${id}`;
      await setNewerColumns(sql, id, v);
      res.status(200).json({ ok: true });
    } catch (err) {
      if (err && err.missingColumn) {
        res.status(409).json({ error: missingColumnMessage(err.missingColumn) });
        return;
      }
      console.error("[streetside] Admin edit failed:", err);
      res.status(500).json({ error: "Failed to save." });
    }
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
