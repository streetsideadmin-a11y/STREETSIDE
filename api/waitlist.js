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

// ---------------------------------------------------------------
// GOOGLE SHEETS SYNC (optional)
// ---------------------------------------------------------------
// If GOOGLE_SHEETS_WEBHOOK_URL is set (a Google Apps Script Web App
// URL — see README.md for the exact setup steps), every submission
// is also sent there to be appended as a row in a Google Sheet.
// This is a best-effort mirror, not the source of truth — the
// database save above always happens first and is what the site's
// own features (neighbor counter, map, address-check) rely on. If
// the Sheets sync fails for any reason, it's logged but never
// blocks or breaks the person's actual submission.
async function syncToGoogleSheet(payload) {
  var url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[streetside] Google Sheets sync failed (submission was still saved to the database):", err);
  }
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
  // counts as "required" depends on which one this is. The waitlist
  // form's "Email or Phone" field means either one on its own is a
  // valid submission — requiring email specifically would silently
  // reject every phone-only signup.
  const isValid =
    formType === "address-check"
      ? !!body.streetAddress && !!body.zip
      : !!body.email || !!body.phone;

  if (!isValid) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const values = [
      body.formType || "waitlist",
      body.firstName || null,
      body.lastName || null,
      body.email || null,
      body.phone || null,
      body.streetAddress || null,
      body.city || null,
      body.zip || null,
      body.collectionDay || null,
      body.wasteProvider || null,
      body.trashBinCount ? parseInt(body.trashBinCount, 10) : null,
      body.recyclingBinCount ? parseInt(body.recyclingBinCount, 10) : null,
      body.binStorageLocation || null,
      body.interestedPackage || null,
      body.hearAboutUs || null,
      !!body.consent,
      body.submittedAt || new Date().toISOString(),
    ];

    try {
      await sql`
        INSERT INTO signups (
          form_type, first_name, last_name, email, phone,
          street_address, city, zip, collection_day, waste_provider,
          trash_bin_count, recycling_bin_count, bin_storage_location,
          interested_package, hear_about_us, consent, submitted_at
        ) VALUES (
          ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]},
          ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]},
          ${values[10]}, ${values[11]}, ${values[12]}, ${values[13]}, ${values[14]},
          ${values[15]}, ${values[16]}
        )
      `;
    } catch (insertErr) {
      // If interested_package hasn't been added to the database yet
      // (a migration step documented in schema.sql), don't let that
      // break every single submission — save everything else and log
      // a clear warning instead, so the fix is a config problem you
      // can find in the logs, never a lost signup.
      const missingColumn =
        insertErr && (insertErr.code === "42703" || /interested_package/i.test(String(insertErr.message)));
      if (!missingColumn) throw insertErr;

      console.warn(
        "[streetside] 'interested_package' column not found — run the migration in schema.sql. Saving this submission without it for now."
      );
      await sql`
        INSERT INTO signups (
          form_type, first_name, last_name, email, phone,
          street_address, city, zip, collection_day, waste_provider,
          trash_bin_count, recycling_bin_count, bin_storage_location,
          hear_about_us, consent, submitted_at
        ) VALUES (
          ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]},
          ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]},
          ${values[10]}, ${values[11]}, ${values[12]}, ${values[14]},
          ${values[15]}, ${values[16]}
        )
      `;
    }

    // Best-effort mirror to Google Sheets — never blocks or breaks
    // the response if it fails; the database row above already saved.
    await syncToGoogleSheet({
      formType: body.formType || "waitlist",
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      email: body.email || "",
      phone: body.phone || "",
      streetAddress: body.streetAddress || "",
      city: body.city || "",
      zip: body.zip || "",
      collectionDay: body.collectionDay || "",
      wasteProvider: body.wasteProvider || "",
      trashBinCount: body.trashBinCount || "",
      recyclingBinCount: body.recyclingBinCount || "",
      binStorageLocation: body.binStorageLocation || "",
      interestedPackage: body.interestedPackage || "",
      hearAboutUs: body.hearAboutUs || "",
      consent: !!body.consent,
      submittedAt: body.submittedAt || new Date().toISOString(),
    });

    const available = formType === "address-check" ? isAddressInServiceArea(body.city, body.zip) : undefined;

    // For an address-check that isn't in an active area yet, tell the
    // person how many real waitlist signups already exist in that same
    // city — not address-check lookups (including this one), since
    // checking an address isn't itself a signal of demand the way
    // actually joining the waitlist is.
    let nearbyCount;
    if (formType === "address-check" && !available && body.city) {
      const rows = await sql`
        SELECT COUNT(*)::int AS count
        FROM signups
        WHERE form_type = 'waitlist' AND lower(btrim(city)) = lower(btrim(${body.city}))
      `;
      nearbyCount = rows[0].count;
    }

    res.status(200).json({
      ok: true,
      formType: formType,
      available: available,
      nearbyCount: nearbyCount,
    });
  } catch (err) {
    console.error("[streetside] Failed to save submission:", err);
    res.status(500).json({ error: "Something went wrong saving your submission." });
  }
};
