-- Migration: admissions collect both permanent and current address, split
-- into street / barangay / city-municipality / province.
-- Run in Supabase SQL editor BEFORE deploying the updated code. Additive only:
-- `address` keeps holding the composed permanent address so existing readers
-- still work; old rows (address + address_type) are left as they are.

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS permanent_street   TEXT,
  ADD COLUMN IF NOT EXISTS permanent_barangay TEXT,
  ADD COLUMN IF NOT EXISTS permanent_city     TEXT,
  ADD COLUMN IF NOT EXISTS permanent_province TEXT,
  ADD COLUMN IF NOT EXISTS current_street     TEXT,
  ADD COLUMN IF NOT EXISTS current_barangay   TEXT,
  ADD COLUMN IF NOT EXISTS current_city       TEXT,
  ADD COLUMN IF NOT EXISTS current_province   TEXT,
  ADD COLUMN IF NOT EXISTS current_address    TEXT;
