-- Streetside — database schema
-- ---------------------------------------------------------------
-- Run this once against your database before the API functions will
-- work. In the Neon dashboard: open your project → SQL Editor →
-- paste this in → Run. (Or use `psql "$DATABASE_URL" -f schema.sql`
-- from your own machine if you have psql installed.)

CREATE TABLE IF NOT EXISTS signups (
  id                     SERIAL PRIMARY KEY,
  form_type              TEXT NOT NULL,           -- 'waitlist' or 'address-check'
  first_name             TEXT,
  last_name              TEXT,
  email                  TEXT,
  phone                  TEXT,
  street_address         TEXT,
  city                   TEXT,
  zip                    TEXT,
  collection_day         TEXT,
  waste_provider         TEXT,
  trash_bin_count        INTEGER,
  recycling_bin_count    INTEGER,
  bin_storage_location   TEXT,
  interested_package     TEXT,                    -- 'curb', 'full', 'one-time', or 'not-sure'
  hear_about_us          TEXT,
  consent                BOOLEAN DEFAULT FALSE,
  contacted              BOOLEAN DEFAULT FALSE,   -- set from the admin dashboard
  submitted_at           TIMESTAMPTZ DEFAULT now()
);

-- Speeds up the neighbor-count endpoint, which filters by form_type.
CREATE INDEX IF NOT EXISTS idx_signups_form_type ON signups (form_type);

-- Caches real municipal boundary shapes (fetched from OpenStreetMap's
-- free Nominatim service) so each town only ever needs to be looked
-- up ONE time, ever — no matter how many site visitors or admin
-- sessions ask for it after that. Without this, showing real
-- boundaries on the public map (which any number of visitors could
-- load at once) could mean far more requests to that free service
-- than its usage policy allows.
CREATE TABLE IF NOT EXISTS town_boundaries (
  town           TEXT PRIMARY KEY,   -- normalized town key, e.g. 'canal winchester'
  geojson        JSONB,              -- the real boundary shape, or NULL if none was found
  fetched_at     TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- MIGRATIONS — if your database already exists (you set it up before
-- these columns/tables were added), run whichever of these you're
-- missing in Neon's SQL Editor:
--
--   ALTER TABLE signups ADD COLUMN IF NOT EXISTS interested_package TEXT;
--   ALTER TABLE signups ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT FALSE;
--   CREATE TABLE IF NOT EXISTS town_boundaries (
--     town TEXT PRIMARY KEY, geojson JSONB, fetched_at TIMESTAMPTZ DEFAULT now()
--   );
--
-- The CREATE TABLE above uses IF NOT EXISTS, so it's harmless to
-- re-run the whole file too — it just won't add new columns to an
-- already-existing table, which is what these ALTER TABLE lines are for.
