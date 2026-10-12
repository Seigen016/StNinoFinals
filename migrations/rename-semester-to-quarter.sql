-- Migration: rename semester column to quarter in classes and enrollment_requests
-- Run this in Supabase SQL editor AFTER deploying the updated code

-- 1. Rename column in classes table (semester is VARCHAR here)
ALTER TABLE classes RENAME COLUMN semester TO quarter;

-- 2. Rename column in enrollment_requests table (semester is INTEGER here)
ALTER TABLE enrollment_requests RENAME COLUMN semester TO quarter;

-- 3. Drop old constraints if they exist (names may differ — safe to ignore errors)
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_semester_check;
ALTER TABLE enrollment_requests DROP CONSTRAINT IF EXISTS enrollment_requests_semester_check;

-- 4. Add new constraints
--    classes.quarter is VARCHAR  → use IN ('1','2','3','4')
ALTER TABLE classes
  ADD CONSTRAINT classes_quarter_check
  CHECK (quarter IN ('1', '2', '3', '4'));

--    enrollment_requests.quarter is INTEGER → BETWEEN works fine
ALTER TABLE enrollment_requests
  ADD CONSTRAINT enrollment_requests_quarter_check
  CHECK (quarter BETWEEN 1 AND 4);
