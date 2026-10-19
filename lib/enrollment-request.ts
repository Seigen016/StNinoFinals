import { isSeniorHigh } from './academic-period';
import { normalizeSchoolYear } from './school-year';
import type { getSupabaseAdmin } from './supabaseAdmin';

type Supabase = ReturnType<typeof getSupabaseAdmin>;

/**
 * Shared checks for a new enrollment request (student or parent submitted).
 * Returns an error message, or the section to pre-fill: the one admin assigned
 * on this student's last approved request for the same grade and school year,
 * so quarter 2-4 re-enrollments carry the quarter 1 section and admin only
 * verifies it.
 */
export async function prepareEnrollmentRequest(
  supabase: Supabase,
  input: { studentId: string; gradeLevel: string; strand?: string | null; schoolYear: string }
): Promise<{ error: string } | { assignedSectionId: string | null }> {
  if (isSeniorHigh(input.gradeLevel) && !input.strand) {
    return { error: 'Please select a strand for Senior High School.' };
  }

  const { data: previous } = await supabase
    .from('enrollment_requests')
    .select('assigned_section_id, section:sections!enrollment_requests_assigned_section_id_fkey(is_active, strand)')
    .eq('student_id', input.studentId)
    .eq('status', 'approved')
    .eq('grade_level', input.gradeLevel)
    .eq('school_year', normalizeSchoolYear(input.schoolYear))
    .not('assigned_section_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const section: any = Array.isArray((previous as any)?.section) ? (previous as any).section[0] : (previous as any)?.section;
  const usable =
    previous?.assigned_section_id &&
    section?.is_active !== false &&
    (!section?.strand || !input.strand || section.strand === input.strand);

  return { assignedSectionId: usable ? previous!.assigned_section_id : null };
}
