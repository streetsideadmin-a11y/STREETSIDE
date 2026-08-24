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
  hear_about_us          TEXT,
  consent                BOOLEAN DEFAULT FALSE,
  submitted_at           TIMESTAMPTZ DEFAULT now()
);

-- Speeds up the neighbor-count endpoint, which filters by form_type.
CREATE INDEX IF NOT EXISTS idx_signups_form_type ON signups (form_type);
