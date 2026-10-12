-- Phase 5: Cleanup — drop legacy columns and dead table
-- Run AFTER at least 4 weeks of stable production with Phases 1-4.
-- Take a database backup before running this migration.

-- ─── 1. Drop enrollment_requests.quarter ─────────────────────────────────────
-- Replaced by: entry_quarter (for transferees) + assigned_section_id (for section link)
-- All new inserts no longer populate this column.
ALTER TABLE enrollment_requests DROP COLUMN IF EXISTS quarter;

-- ─── 2. Drop the dead class_enrollments table ─────────────────────────────────
-- All code now uses user_classes.  class_enrollments is unused.
DROP TABLE IF EXISTS class_enrollments;

-- ─── 3. Optional: index for fast section lookups on enrollment_requests ───────
CREATE INDEX IF NOT EXISTS enrollment_requests_assigned_section_idx
  ON enrollment_requests (assigned_section_id)
  WHERE assigned_section_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS enrollment_requests_entry_quarter_idx
  ON enrollment_requests (entry_quarter)
  WHERE entry_quarter IS NOT NULL;
