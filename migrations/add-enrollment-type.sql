-- Migration: Phase 2 — Annual enrollment model
-- Run in Supabase SQL editor AFTER add-academic-periods.sql.
-- This migration is backward-compatible: existing quarter values are preserved.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Make enrollment_requests.quarter nullable
--    (Quarter is no longer chosen by the student; it is recorded automatically
--     from the active academic period at submission time, and will be NULL for
--     requests submitted under the new annual model.)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE enrollment_requests
  ALTER COLUMN quarter DROP NOT NULL;

-- Drop the old check so NULL passes cleanly; re-add to still validate non-null values.
ALTER TABLE enrollment_requests
  DROP CONSTRAINT IF EXISTS enrollment_requests_quarter_check;

ALTER TABLE enrollment_requests
  ADD CONSTRAINT enrollment_requests_quarter_check
  CHECK (quarter IS NULL OR quarter BETWEEN 1 AND 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add enrollment_type column
--    Classifies each request so the registrar knows what review steps apply.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE enrollment_requests
  ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'new'
    CHECK (enrollment_type IN ('new', 'returning', 'transferee', 'returnee', 'repeater'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add entry_quarter column
--    For transferees / late enrollees: the specific quarter they are entering.
--    NULL means "start from Q1" (normal case).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE enrollment_requests
  ADD COLUMN IF NOT EXISTS entry_quarter INTEGER
    CHECK (entry_quarter IS NULL OR entry_quarter BETWEEN 1 AND 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add previous_school column
--    Required for transferees; optional otherwise.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE enrollment_requests
  ADD COLUMN IF NOT EXISTS previous_school TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Backfill enrollment_type for existing records
--    Heuristic: if a student already had an approved request in a prior school
--    year, mark subsequent requests as 'returning'; otherwise 'new'.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE enrollment_requests er
SET    enrollment_type = 'returning'
WHERE  enrollment_type = 'new'
  AND  EXISTS (
    SELECT 1
    FROM   enrollment_requests er2
    WHERE  er2.student_id  = er.student_id
      AND  er2.status      = 'approved'
      AND  er2.school_year < er.school_year
  );
