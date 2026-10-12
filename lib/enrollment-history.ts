import { Database } from '@/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Snapshots every student's current `user_classes` rows into `enrollment_history`
 * (joined with each class's school_year), then clears the live enrollment —
 * same end state as before, but the enrollment is archived instead of destroyed.
 *
 * Centralized here because the same two-step "unenroll all students" sequence
 * was duplicated across the end-school-year route, its cron twin, and the
 * new-school-year creation route — all three should archive, not just delete.
 */
export async function snapshotAndUnenrollStudents(
  admin: SupabaseClient<Database>
): Promise<{ error: string | null }> {
  const { data: enrollments, error: fetchErr } = await admin
    .from('user_classes')
    .select('user_id, class_id, membership_type, classes(school_year)')
    .eq('membership_type', 'student');

  if (fetchErr) {
    return { error: `Failed to read current enrollments: ${fetchErr.message}` };
  }

  if (enrollments && enrollments.length > 0) {
    const snapshotRows = enrollments
      .filter((e: any) => e.classes?.school_year)
      .map((e: any) => ({
        user_id: e.user_id,
        class_id: e.class_id,
        school_year: e.classes.school_year as string,
        membership_type: e.membership_type,
      }));

    if (snapshotRows.length > 0) {
      const { error: snapshotErr } = await admin
        .from('enrollment_history')
        .insert(snapshotRows);

      if (snapshotErr) {
        return { error: `Failed to archive enrollments: ${snapshotErr.message}` };
      }
    }
  }

  const { error: deleteErr } = await admin
    .from('user_classes')
    .delete()
    .eq('membership_type', 'student');

  if (deleteErr) {
    return { error: `Failed to unenroll students: ${deleteErr.message}` };
  }

  await admin.from('users').update({ section: null }).eq('role', 'student');

  return { error: null };
}
