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

  // A spreadsheet treats text starting with = + - @ as a formula, and the
  // signup form is public — so defuse those before they reach the Sheet.
  const safe = {};
  Object.keys(payload).forEach(function (k) {
    const v = payload[k];
    safe[k] = typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  });

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safe),
    });
  } catch (err) {
    console.warn("[streetside] Google Sheets sync failed (submission was still saved to the database):", err);
  }
}

// ---------------------------------------------------------------
// SPAM PROTECTION & INPUT CLEANING
// ---------------------------------------------------------------
// Layers, from cheapest to most thorough:
//   1. Honeypot — the form has a hidden "website" field no human sees.
//      Bots fill it in; we quietly pretend it worked and save nothing.
//   2. Speed check — a form "submitted" less than 1.5 seconds after the
//      page loaded is a script, not a person.
//   3. Per-visitor limit — max 6 submissions per 10 minutes from one
//      IP address (kept in memory, so it's best-effort across Vercel's
//      servers — it stops a lone script, not a distributed attack).
//   4. Flood brake — if the database already got a huge burst of
//      signups in the last 10 minutes, new ones are paused briefly.
//   5. Field length limits and real email / phone checks.
// Bots that are caught get a normal-looking "ok" so they don't learn
// what tripped them; real people only ever see a message when they
// genuinely typed something wrong or hit a limit.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_PER_IP = 6;
const FLOOD_MAX_PER_WINDOW = 60;
const MIN_FILL_TIME_MS = 1500;
const recentByIp = new Map();

function getClientIp(req) {
  const fwd = req.headers && req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function overIpLimit(ip) {
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) {
    recentByIp.forEach(function (list, key) {
      if (!list.some(function (t) { return now - t < RATE_WINDOW_MS; })) recentByIp.delete(key);
    });
  }
  return hits.length > RATE_MAX_PER_IP;
}

function clean(value, max) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) value = value.join(", ");
  return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function toCount(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 && n <= 99 ? n : null;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function phoneDigitsOf(value) {
  let d = String(value || "").replace(/\D/g, "");
  if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
  return d;
}

// ---------------------------------------------------------------
// OWNER NOTIFICATION (optional)
// ---------------------------------------------------------------
// If RESEND_API_KEY and NOTIFY_EMAIL are set in Vercel, every new
// waitlist signup sends you an email. Resend (resend.com) is free for
// this volume. Optional: NOTIFY_FROM (a sender on a domain you've
// verified with Resend; defaults to Resend's test sender, which can
// only deliver to the email you signed up to Resend with). Like the
// Sheets sync, this is best-effort — it can never block or break a
// signup, and it gives up after 4 seconds.
async function notifyOwner(info) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;

  const esc = function (v) {
    return String(v || "—").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  const name = [info.firstName, info.lastName].filter(Boolean).join(" ") || "Someone";
  const rows = [
    ["Contact", info.email || info.phone],
    ["Address", [info.streetAddress, info.city, info.zip].filter(Boolean).join(", ")],
    ["Package", info.interestedPackage],
    ["Promo code", info.promoCode],
    ["Heard about us", info.hearAboutUs],
    ["Came from", info.attribution],
  ];
  const html =
    "<h2>New Streetside waitlist signup</h2><p><strong>" + esc(name) + "</strong></p><table cellpadding=\"4\">" +
    rows.map(function (r) { return "<tr><td><strong>" + r[0] + "</strong></td><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
    "</table>";

  try {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 4000);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Streetside <onboarding@resend.dev>",
        to: [to],
        subject: "New signup: " + name + (info.city ? " (" + info.city + ")" : ""),
        html: html,
      }),
    });
    clearTimeout(timer);
  } catch (err) {
    console.warn("[streetside] Owner notification failed (signup was still saved):", err && err.message);
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

  const raw = req.body && typeof req.body === "object" ? req.body : {};
  const formType = raw.formType === "address-check" ? "address-check" : "waitlist";

  // 1 & 2 — bots: honeypot filled, or form "submitted" instantly.
  const filledTooFast =
    Number(raw.formLoadedAt) > 0 && Date.now() - Number(raw.formLoadedAt) < MIN_FILL_TIME_MS;
  if (clean(raw.website, 200) || filledTooFast) {
    console.info("[streetside] Dropped a suspected bot submission.");
    res.status(200).json({ ok: true, formType: formType });
    return;
  }

  // 3 — one visitor, too many submissions.
  if (overIpLimit(getClientIp(req))) {
    res.status(429).json({ error: "That's a lot of submissions in a short time — please wait a few minutes and try again." });
    return;
  }

  // 5 — clean everything and cap lengths. `body` below is the trusted copy.
  const body = {
    formType: formType,
    firstName: clean(raw.firstName, 80),
    lastName: clean(raw.lastName, 80),
    email: clean(raw.email, 254).toLowerCase(),
    phone: clean(raw.phone, 30),
    streetAddress: clean(raw.streetAddress, 150),
    city: clean(raw.city, 80),
    zip: clean(raw.zip, 10),
    collectionDay: clean(raw.collectionDay, 30),
    wasteProvider: clean(raw.wasteProvider, 80),
    trashBinCount: toCount(raw.trashBinCount),
    recyclingBinCount: toCount(raw.recyclingBinCount),
    binStorageLocation: clean(raw.binStorageLocation, 100),
    interestedPackage: clean(raw.interestedPackage, 40),
    hearAboutUs: clean(raw.hearAboutUs, 100),
    promoCode: raw.promoCode,
    attribution: clean(raw.attribution, 300),
    consent: !!raw.consent,
    // Always the server's clock — the browser's can be wrong or faked.
    submittedAt: new Date().toISOString(),
  };

  // The waitlist form's "Email or Phone" field means either one on its
  // own is a valid submission (requiring email specifically would
  // silently reject every phone-only signup) — but whichever they gave
  // has to look real.
  let isValid;
  let validationError = "Missing required fields.";
  if (formType === "address-check") {
    isValid = !!body.streetAddress && !!body.zip;
  } else {
    const emailOk = !!body.email && isEmail(body.email);
    const phoneOk = !!body.phone && phoneDigitsOf(body.phone).length === 10;
    isValid = emailOk || phoneOk;
    if (!isValid && (body.email || body.phone)) {
      validationError = body.email
        ? "That email address doesn't look quite right — please double-check it."
        : "That phone number doesn't look quite right — please enter all 10 digits, or use your email instead.";
    }
  }

  if (!isValid) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // 4 — flood brake, and duplicate check, before anything is saved.
    if (formType === "waitlist") {
      const burst = await sql`
        SELECT COUNT(*)::int AS count FROM signups
        WHERE form_type = 'waitlist' AND submitted_at > now() - interval '10 minutes'
      `;
      if (burst[0].count >= FLOOD_MAX_PER_WINDOW) {
        console.warn("[streetside] Waitlist flood brake tripped — " + burst[0].count + " signups in 10 minutes.");
        res.status(429).json({ error: "We're getting a lot of signups right now — please try again in a few minutes." });
        return;
      }

      // Same person signing up twice (same email, or same phone number
      // however it was typed) is not saved again, so it can't use up a
      // second founding spot. They're told they're already on the list.
      const dupPhone = body.phone ? phoneDigitsOf(body.phone) : "";
      const existing = await sql`
        SELECT id FROM signups
        WHERE form_type = 'waitlist'
          AND (
            (${body.email}::text <> '' AND lower(btrim(email)) = ${body.email}::text)
            OR (${dupPhone}::text <> '' AND right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10) = ${dupPhone}::text)
          )
        LIMIT 1
      `;
      if (existing.length) {
        res.status(200).json({ ok: true, formType: formType, duplicate: true });
        return;
      }
    }

    const values = [
      body.formType,
      body.firstName || null,
      body.lastName || null,
      body.email || null,
      body.phone || null,
      body.streetAddress || null,
      body.city || null,
      body.zip || null,
      body.collectionDay || null,
      body.wasteProvider || null,
      body.trashBinCount,
      body.recyclingBinCount,
      body.binStorageLocation || null,
      body.interestedPackage || null,
      body.hearAboutUs || null,
      body.consent,
      body.submittedAt,
    ];

    // Discount type isn't collected on the public form — it's assigned
    // later by Streetside staff from the admin dashboard (see
    // api/admin-update.js) — so new rows always start with it NULL.
    let insertedRows;
    try {
      insertedRows = await sql`
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
        RETURNING id
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
      insertedRows = await sql`
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
        RETURNING id
      `;
    }

    // Optional promo / referral code — saved in a follow-up step so a
    // database that hasn't had the promo_code migration yet can never
    // cost anyone their signup (see schema.sql). Re-sanitized here
    // because the server never trusts what the browser already cleaned.
    const promoCode = String(body.promoCode || "")
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 40);
    if (promoCode && insertedRows && insertedRows[0]) {
      try {
        await sql`UPDATE signups SET promo_code = ${promoCode} WHERE id = ${insertedRows[0].id}`;
      } catch (promoErr) {
        console.warn(
          "[streetside] Could not save promo_code — run the migration in schema.sql (ALTER TABLE signups ADD COLUMN IF NOT EXISTS promo_code TEXT;). The signup itself was saved.",
          promoErr && promoErr.message
        );
      }
    }

    // Where the visitor came from (ad / campaign tags) — also saved in a
    // follow-up step so a database without the `attribution` column yet
    // never loses a signup (see schema.sql).
    if (body.attribution && insertedRows && insertedRows[0]) {
      try {
        await sql`UPDATE signups SET attribution = ${body.attribution} WHERE id = ${insertedRows[0].id}`;
      } catch (attrErr) {
        console.warn(
          "[streetside] Could not save attribution — run the migration in schema.sql (ALTER TABLE signups ADD COLUMN IF NOT EXISTS attribution TEXT;). The signup itself was saved.",
          attrErr && attrErr.message
        );
      }
    }

    // Best-effort mirror to Google Sheets — never blocks or breaks
    // the response if it fails; the database row above already saved.
    await syncToGoogleSheet({
      formType: body.formType,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      streetAddress: body.streetAddress,
      city: body.city,
      zip: body.zip,
      collectionDay: body.collectionDay,
      wasteProvider: body.wasteProvider,
      trashBinCount: body.trashBinCount === null ? "" : body.trashBinCount,
      recyclingBinCount: body.recyclingBinCount === null ? "" : body.recyclingBinCount,
      binStorageLocation: body.binStorageLocation,
      interestedPackage: body.interestedPackage,
      promoCode: promoCode,
      attribution: body.attribution,
      hearAboutUs: body.hearAboutUs,
      consent: body.consent,
      submittedAt: body.submittedAt,
    });

    if (formType === "waitlist") {
      await notifyOwner({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        streetAddress: body.streetAddress,
        city: body.city,
        zip: body.zip,
        interestedPackage: body.interestedPackage,
        promoCode: promoCode,
        hearAboutUs: body.hearAboutUs,
        attribution: body.attribution,
      });
    }

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
