-- Migration: RED■FENSE panel feedback, P0 slice
-- Run in Supabase SQL editor AFTER deploying the updated code.
-- Additive only — no columns are renamed or dropped, so existing data and code paths
-- that don't reference these new columns keep working.

-- admissions: enrollment type + target school year (Section 2)
-- Same value set/naming as enrollment_requests.enrollment_type (migrations/add-enrollment-type.sql)
-- so both flows stay consistent.
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'new'
    CHECK (enrollment_type IN ('new', 'returning', 'transferee', 'returnee', 'repeater'));

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS school_year TEXT DEFAULT NULL;

-- previous_school was NOT NULL, which forced even brand-new applicants to fill it in.
-- Relaxed so it's only meaningfully required for transferee/returnee (enforced in the UI/API).
ALTER TABLE admissions
  ALTER COLUMN previous_school DROP NOT NULL;

-- users: guardian identity carried over from admissions on approval (Section 1/2)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guardian_name TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guardian_email TEXT DEFAULT NULL;

-- users: structured permanent-address fields the admin student form already
-- collects and sends, but the API silently drops (see app/admin/students/page.tsx
-- openEditDialog reading student.barangay/barangay_name/street_details — always
-- undefined today because these columns never existed).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS barangay TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS barangay_name TEXT DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS street_details TEXT DEFAULT NULL;

-- grades: capture why a grade was rejected (Section 4)
ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- users: prevent the same physical RFID card from being bound to two people.
-- Partial unique index (ignores NULL/unassigned) — defense in depth behind the
-- application-level check added in the RFID write endpoints.
CREATE UNIQUE INDEX IF NOT EXISTS users_rfid_unique ON users(rfid) WHERE rfid IS NOT NULL;
