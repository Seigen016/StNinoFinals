-- Migration: guardian contact + DOB + current address fields (Redefense PRD, Section 1)
-- Run in Supabase SQL editor AFTER deploying the updated code.
-- Additive only — no columns are renamed or dropped, so existing data and code paths
-- that still read `admissions.middle_initial` / `users.address` keep working.

-- admissions (public admission inquiry form)
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS middle_name TEXT DEFAULT NULL;

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT DEFAULT NULL;

-- users (student/staff records)
-- `address` remains the permanent address; `current_address` is new and optional.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS current_address TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT DEFAULT NULL;
