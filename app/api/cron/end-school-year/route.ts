import { snapshotAndUnenrollStudents } from '@/lib/enrollment-history';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/cron/end-school-year
// Runs daily. Checks if Q4 is active and its end_date has passed.
// If so, runs the full end-of-year unenrollment automatically.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Find a Q4 period that is still active but whose end_date has passed
  const { data: period, error: fetchErr } = await supabase
    .from('academic_periods')
    .select('id, school_year, quarter, end_date')
    .eq('quarter', 4)
    .eq('is_active', true)
    .lte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
  }

  if (!period) {
    return NextResponse.json({ success: true, message: 'No Q4 period ready to close.', closed: false });
  }

  const schoolYear = period.school_year;

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

  // 4. Mark active_quarter = 0 in system_settings
  await upsertSetting(supabase, 'active_quarter', '0');

  console.log(`[cron/end-school-year] Auto-closed school year ${schoolYear} on ${today}`);

  return NextResponse.json({
    success: true,
    closed: true,
    message: `School year ${schoolYear} auto-closed. All students unenrolled.`,
  });
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
