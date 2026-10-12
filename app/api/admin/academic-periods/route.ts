import { getActivePeriod, getPeriodsForYear } from '@/lib/academic-period';
import { snapshotAndUnenrollStudents } from '@/lib/enrollment-history';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/academic-periods?schoolYear=2026-2027
// Returns all four periods for the given school year (defaults to active year).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let schoolYear = searchParams.get('schoolYear');

    if (!schoolYear) {
      const active = await getActivePeriod();
      schoolYear = active?.schoolYear ?? null;
    }

    if (!schoolYear) {
      return NextResponse.json({ success: false, error: 'No active school year found' }, { status: 404 });
    }

    const periods = await getPeriodsForYear(schoolYear);

    // If the table doesn't exist yet (pre-migration), return an empty array gracefully.
    return NextResponse.json({ success: true, data: periods, schoolYear });
  } catch (error: any) {
    console.error('GET /api/admin/academic-periods:', error);
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/academic-periods
// Creates all 4 quarters for a new school year with Q1 active.
// Body: { schoolYear: "2026-2027" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolYear } = body;

    if (!schoolYear || !/^\d{4}-\d{4}$/.test(schoolYear)) {
      return NextResponse.json(
        { success: false, error: 'schoolYear must be in YYYY-YYYY format (e.g. 2026-2027)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Prevent duplicates
    const { data: existing } = await supabase
      .from('academic_periods')
      .select('id')
      .eq('school_year', schoolYear)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `School year ${schoolYear} already exists.` },
        { status: 409 }
      );
    }

    // Clean up any lingering enrollments from a prior year that wasn't properly closed
    // (archived into enrollment_history rather than just dropped)
    await snapshotAndUnenrollStudents(supabase);

    const quarters = [1, 2, 3, 4].map((q) => ({
      school_year:     schoolYear,
      quarter:         q,
      label:           `Quarter ${q}`,
      is_active:       q === 1,
      is_grading_open: q === 1,
      start_date:      null,
      end_date:        null,
    }));

    const { error: insertErr } = await supabase.from('academic_periods').insert(quarters);
    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    // Mirror active_quarter = 1 in system_settings
    const { data: existing2 } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', 'active_quarter')
      .limit(1);

    if (existing2 && existing2.length > 0) {
      await supabase
        .from('system_settings')
        .update({ setting_value: '1', updated_at: new Date().toISOString() })
        .eq('id', existing2[0].id);
    } else {
      await supabase
        .from('system_settings')
        .insert({ setting_key: 'active_quarter', setting_value: '1' });
    }

    return NextResponse.json({
      success: true,
      message: `School year ${schoolYear} created. Quarter 1 is now active.`,
      schoolYear,
    });
  } catch (error: any) {
    console.error('POST /api/admin/academic-periods:', error);
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/academic-periods
// Updates a single period's dates or grading-open flag.
// Body: { schoolYear, quarter, startDate?, endDate?, isGradingOpen? }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolYear, quarter, startDate, endDate, isGradingOpen } = body;

    if (!schoolYear || !quarter) {
      return NextResponse.json({ success: false, error: 'schoolYear and quarter are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const update: Record<string, any> = {};
    if (startDate    !== undefined) update.start_date      = startDate    || null;
    if (endDate      !== undefined) update.end_date        = endDate      || null;
    if (isGradingOpen !== undefined) update.is_grading_open = isGradingOpen;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('academic_periods')
      .update(update)
      .eq('school_year', schoolYear)
      .eq('quarter', quarter);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH /api/admin/academic-periods:', error);
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
