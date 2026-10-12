-- Migration: Add academic_periods table for annual enrollment refactor (Phase 1)
-- Run in Supabase SQL editor BEFORE deploying the updated code.
-- This migration is fully additive — no existing tables or data are modified.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create academic_periods table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_periods (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year     TEXT        NOT NULL,
  quarter         INTEGER     NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  label           TEXT        NOT NULL,          -- e.g. "Quarter 1", "Quarter 2"
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_grading_open BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_year, quarter)
);

-- Enforce that at most one period is active across the entire table.
-- A partial unique index on a constant works: only one row can have is_active = TRUE.
CREATE UNIQUE INDEX IF NOT EXISTS academic_periods_one_active_idx
  ON academic_periods (is_active)
  WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Seed periods for SY 2025-2026 (historical) and 2026-2027 (current)
--    Adjust is_active and start_date/end_date to match your real school calendar.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO academic_periods (school_year, quarter, label, start_date, end_date, is_active, is_grading_open) VALUES
  ('2025-2026', 1, 'Quarter 1', '2025-06-09', '2025-09-05', FALSE, FALSE),
  ('2025-2026', 2, 'Quarter 2', '2025-09-08', '2025-11-28', FALSE, FALSE),
  ('2025-2026', 3, 'Quarter 3', '2026-01-05', '2026-03-27', FALSE, FALSE),
  ('2025-2026', 4, 'Quarter 4', '2026-03-30', '2026-05-29', FALSE, FALSE),
  ('2026-2027', 1, 'Quarter 1', '2026-06-08', '2026-09-04', TRUE,  TRUE ),
  ('2026-2027', 2, 'Quarter 2', '2026-09-07', '2026-11-27', FALSE, TRUE ),
  ('2026-2027', 3, 'Quarter 3', '2027-01-04', '2027-03-26', FALSE, TRUE ),
  ('2026-2027', 4, 'Quarter 4', '2027-03-29', '2027-05-28', FALSE, TRUE )
ON CONFLICT (school_year, quarter) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed active period keys in system_settings (safe — only inserts if missing)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, updated_at)
  SELECT 'active_school_year', '2026-2027', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'active_school_year');

INSERT INTO system_settings (setting_key, setting_value, updated_at)
  SELECT 'active_quarter', '1', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'active_quarter');

INSERT INTO system_settings (setting_key, setting_value, updated_at)
  SELECT 'enrollment_open', 'true', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'enrollment_open');
