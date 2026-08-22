// Vercel serverless function — POST /api/waitlist
// ---------------------------------------------------------------
// Handles both the main waitlist form and the "check your address"
// form (scripts/waitlist-form.js already sends a `formType` field
// that tells them apart). Requires a DATABASE_URL environment
// variable pointing at a Postgres database — see README.md for how
// to provision one via the Vercel Marketplace (Neon).
//
// This file only runs at all once you deploy it on Vercel — it does
// nothing on a plain static host like Netlify/GitHub Pages.

const { neon } = require("@neondatabase/serverless");

// ---------------------------------------------------------------
// LIVE SERVICE AREAS
// ---------------------------------------------------------------
// Empty until a real route opens somewhere — keep this in sync with
// config/site-config.js's serviceArea section (that file drives what
// the site SAYS about coverage; this one drives what the address
// checker actually DOES). Add a city name and/or ZIP code here once
// a route is genuinely live there.
//
// Example once you have a real route:
//   const ACTIVE_CITIES = ["Lancaster", "Pickerington"];
//   const ACTIVE_ZIPS = ["43130", "43147"];
const ACTIVE_CITIES = [];
const ACTIVE_ZIPS = [];

function isAddressInServiceArea(city, zip) {
  var cityMatch = !!city && ACTIVE_CITIES.some(function (c) {
    return c.toLowerCase() === city.trim().toLowerCase();
  });
  var zipMatch = !!zip && ACTIVE_ZIPS.includes(zip.trim());
  return cityMatch || zipMatch;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("[streetside] DATABASE_URL is not set — see README.md.");
    res.status(500).json({ error: "Server is not configured yet." });
    return;
  }

  const body = req.body || {};
  const formType = body.formType || "waitlist";

  // Minimal server-side sanity check. The browser form already
  // validates required fields, but a server should never trust the
  // client alone. Different forms collect different fields, so what
  // counts as "required" depends on which one this is.
  const isValid =
    formType === "address-check"
      ? !!body.streetAddress && !!body.zip
      : !!body.email;

  if (!isValid) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      INSERT INTO signups (
        form_type, first_name, last_name, email, phone,
        street_address, city, zip, collection_day, waste_provider,
        trash_bin_count, recycling_bin_count, bin_storage_location,
        hear_about_us, consent, submitted_at
      ) VALUES (
        ${body.formType || "waitlist"},
        ${body.firstName || null},
        ${body.lastName || null},
        ${body.email || null},
        ${body.phone || null},
        ${body.streetAddress || null},
        ${body.city || null},
        ${body.zip || null},
        ${body.collectionDay || null},
        ${body.wasteProvider || null},
        ${body.trashBinCount ? parseInt(body.trashBinCount, 10) : null},
        ${body.recyclingBinCount ? parseInt(body.recyclingBinCount, 10) : null},
        ${body.binStorageLocation || null},
        ${body.hearAboutUs || null},
        ${!!body.consent},
        ${body.submittedAt || new Date().toISOString()}
      )
    `;

    res.status(200).json({
      ok: true,
      formType: formType,
      available: formType === "address-check" ? isAddressInServiceArea(body.city, body.zip) : undefined,
    });
  } catch (err) {
    console.error("[streetside] Failed to save submission:", err);
    res.status(500).json({ error: "Something went wrong saving your submission." });
  }
};
