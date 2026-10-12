import { getActivePeriod } from '@/lib/academic-period';
import { snapshotAndUnenrollStudents } from '@/lib/enrollment-history';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// POST /api/admin/academic-periods/end-school-year
// Closes out the current school year:
//   1. Locks Q4 grade entry and marks it inactive
//   2. Archives all students' current enrollment into enrollment_history,
//      then unenrolls them — removes them from user_classes
//   3. Clears section assignment on all student records
//   4. Archives (is_active = false) all classes from the closed school year,
//      so they no longer show up in the default class list
//   5. Mirrors active_quarter = 0 in system_settings
export async function POST() {
  try {
    const supabase = getSupabaseAdmin();

    const current = await getActivePeriod();
    if (!current) {
      return NextResponse.json({ success: false, error: 'No active academic period found.' }, { status: 404 });
    }

    if (current.quarter !== 4) {
      return NextResponse.json(
        { success: false, error: 'School year can only be ended from Quarter 4.' },
        { status: 400 }
      );
    }

    const schoolYear = current.schoolYear;

    // 1. Lock and deactivate Q4
    const { error: lockErr } = await supabase
      .from('academic_periods')
      .update({ is_active: false, is_grading_open: false })
      .eq('school_year', schoolYear)
      .eq('quarter', 4);

    if (lockErr) {
      return NextResponse.json({ success: false, error: lockErr.message }, { status: 500 });
    }

    // 2 & 3. Archive current enrollments, then unenroll and clear section
    const { error: unenrollErr } = await snapshotAndUnenrollStudents(supabase);
    if (unenrollErr) {
      return NextResponse.json({ success: false, error: unenrollErr }, { status: 500 });
    }

    // 4. Archive all classes from the closed school year
    const { error: archiveErr } = await supabase
      .from('classes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('school_year', schoolYear);

    if (archiveErr) {
      return NextResponse.json({ success: false, error: archiveErr.message }, { status: 500 });
    }

    // 5. Mirror updated state in system_settings (no active quarter now)
    await upsertSetting(supabase, 'active_quarter', '0');

    return NextResponse.json({
      success: true,
      message: `School year ${schoolYear} closed. All students have been unenrolled.`,
    });
  } catch (error: any) {
    console.error('POST /api/admin/academic-periods/end-school-year:', error);
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}

async function upsertSetting(supabase: any, key: string, value: string) {
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id')
    .eq('setting_key', key)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from('system_settings')
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq('id', existing[0].id);
  } else {
    await supabase
      .from('system_settings')
      .insert({ setting_key: key, setting_value: value });
  }
}
