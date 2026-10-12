-- Phase 3: Formal sections table, enrollment withdrawals, and section FKs
-- Run AFTER add-enrollment-type.sql

-- ─── 1. Formal sections table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  grade_level   TEXT NOT NULL,
  strand        TEXT,
  school_year   TEXT NOT NULL,
  adviser_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  max_capacity  INTEGER NOT NULL DEFAULT 45,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, grade_level, school_year)
);

-- ─── 2. Enrollment withdrawals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollment_withdrawals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     UUID NOT NULL REFERENCES enrollment_requests(id),
  student_id        UUID NOT NULL REFERENCES users(id),
  school_year       TEXT NOT NULL,
  withdrawal_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_reason TEXT,
  processed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Foreign key columns ───────────────────────────────────────────────────
-- Link each class to a formal section
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Link each enrollment request to the section the student was assigned to
ALTER TABLE enrollment_requests
  ADD COLUMN IF NOT EXISTS assigned_section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- ─── 4. Seed sections from unique (section, grade_level, school_year) in classes
INSERT INTO sections (name, grade_level, school_year)
SELECT DISTINCT c.section, c.grade_level, c.school_year
FROM classes c
WHERE c.section    IS NOT NULL AND c.section    <> ''
  AND c.grade_level IS NOT NULL AND c.grade_level <> ''
  AND c.school_year IS NOT NULL AND c.school_year <> ''
ON CONFLICT (name, grade_level, school_year) DO NOTHING;

-- ─── 5. Link existing classes to their formal section ─────────────────────────
UPDATE classes c
SET section_id = s.id
FROM sections s
WHERE c.section     = s.name
  AND c.grade_level = s.grade_level
  AND c.school_year = s.school_year
  AND c.section_id IS NULL;

-- ─── 6. Back-fill approved enrollment_requests with their assigned section ────
UPDATE enrollment_requests er
SET assigned_section_id = s.id
FROM classes c
JOIN sections s
  ON  s.name        = c.section
  AND s.grade_level = c.grade_level
  AND s.school_year = c.school_year
WHERE er.assigned_class_id  = c.id
  AND er.assigned_section_id IS NULL
  AND er.status = 'approved';
