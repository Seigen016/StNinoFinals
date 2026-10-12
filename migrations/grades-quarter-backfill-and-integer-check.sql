-- Migration: grades are stored per quarter and must be whole numbers 0-100.
-- Run in Supabase SQL editor BEFORE deploying the updated code: the teacher
-- grades page now only shows grades whose quarter matches the active quarter,
-- so rows still missing a quarter would disappear from the entry form.

-- 1. Backfill quarter on legacy rows (POST /api/grades never wrote it) from the
--    quarter whose date range contains the row's last write.
UPDATE grades g
SET quarter = ap.quarter
FROM academic_periods ap
WHERE g.quarter IS NULL
  AND ap.start_date IS NOT NULL
  AND ap.end_date IS NOT NULL
  AND (COALESCE(g.updated_at, g.created_at) AT TIME ZONE 'Asia/Manila')::date
      BETWEEN ap.start_date AND ap.end_date;

-- 2. Anything still unassigned (period dates not set, or written between
--    quarters) goes to the currently active quarter, which is how the app
--    treated these rows before.
UPDATE grades
SET quarter = (SELECT quarter FROM academic_periods WHERE is_active LIMIT 1)
WHERE quarter IS NULL
  AND EXISTS (SELECT 1 FROM academic_periods WHERE is_active);

-- 3. OPTIONAL, run only once no decimal grades remain. Postgres checks a
--    constraint on every UPDATE of a row (even NOT VALID ones), so adding it
--    while decimals exist would make approving/rejecting those rows fail.
--    The app already rejects non-integers; this is the database backstop.
--
-- SELECT id, student_id, subject, grade FROM grades WHERE grade <> trunc(grade);
--
-- ALTER TABLE grades
--   ADD CONSTRAINT grades_grade_whole_0_100
--   CHECK (grade BETWEEN 0 AND 100 AND grade = trunc(grade));
