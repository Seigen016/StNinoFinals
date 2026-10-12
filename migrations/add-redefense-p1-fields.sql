-- Migration: RED■FENSE panel feedback, P1 slice
-- Run in Supabase SQL editor AFTER deploying the updated code.
-- Additive only.

-- grade_history: permanent audit trail of grade approve/reject transitions.
-- Separate from grades.rejection_reason (P0), which only holds the most recent
-- reason — this table keeps every past transition even across resubmissions.
CREATE TABLE IF NOT EXISTS grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  quarter INTEGER,
  grade_value NUMERIC NOT NULL,
  status TEXT NOT NULL,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grade_history_grade_id_idx ON grade_history(grade_id);
CREATE INDEX IF NOT EXISTS grade_history_student_id_idx ON grade_history(student_id);

-- enrollment_history: snapshot of user_classes rows taken right before the
-- end-school-year routine deletes them, so past enrollments remain queryable
-- instead of being destroyed. See app/api/admin/academic-periods/end-school-year/route.ts.
CREATE TABLE IF NOT EXISTS enrollment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  school_year TEXT NOT NULL,
  membership_type TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrollment_history_user_id_idx ON enrollment_history(user_id);
CREATE INDEX IF NOT EXISTS enrollment_history_school_year_idx ON enrollment_history(school_year);
