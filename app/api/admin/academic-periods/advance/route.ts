import { getActivePeriod } from '@/lib/academic-period';
import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/academic-periods/advance
// Atomically deactivates the current quarter and activates the next one.
// If the current quarter is Q4, no automatic advance is performed — the admin
// must explicitly open enrollment for the next school year instead.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { lockGrading = true } = body; // whether to lock grade entry on the outgoing quarter

    const supabase = getSupabaseAdmin();

    // 1. Resolve the current active period.
    const current = await getActivePeriod();
    if (!current) {
      return NextResponse.json({ success: false, error: 'No active academic period found. Run the migration first.' }, { status: 404 });
    }

    if (current.quarter === 4) {
      return NextResponse.json(
        { success: false, error: 'Cannot advance past Quarter 4. Open enrollment for the next school year instead.' },
        { status: 400 }
      );
    }

    const nextQuarter = current.quarter + 1;
    const schoolYear  = current.schoolYear;

    // 2. Verify the next period row exists before touching anything.
    const { data: nextRow } = await supabase
      .from('academic_periods')
      .select('id')
      .eq('school_year', schoolYear)
      .eq('quarter', nextQuarter)
      .maybeSingle();

    if (!nextRow) {
      return NextResponse.json(
        { success: false, error: `Quarter ${nextQuarter} period for ${schoolYear} does not exist. Seed the academic_periods table first.` },
        { status: 404 }
      );
    }

    // 3. Deactivate the current period (and optionally lock grade entry).
    const { error: deactivateErr } = await supabase
      .from('academic_periods')
      .update({ is_active: false, is_grading_open: lockGrading ? false : current.isGradingOpen })
      .eq('school_year', schoolYear)
      .eq('quarter', current.quarter);

    if (deactivateErr) {
      return NextResponse.json({ success: false, error: deactivateErr.message }, { status: 500 });
    }

    // 4. Activate the next period.
    const { error: activateErr } = await supabase
      .from('academic_periods')
      .update({ is_active: true, is_grading_open: true })
      .eq('school_year', schoolYear)
      .eq('quarter', nextQuarter);

    if (activateErr) {
      // Rollback: re-activate current period so we don't end up with no active period.
      await supabase
        .from('academic_periods')
        .update({ is_active: true, is_grading_open: current.isGradingOpen })
        .eq('school_year', schoolYear)
        .eq('quarter', current.quarter);

      return NextResponse.json({ success: false, error: activateErr.message }, { status: 500 });
    }

    // 5. Mirror the new active period in system_settings for backward-compat reads.
    await syncSystemSettings(supabase, schoolYear, nextQuarter);

    return NextResponse.json({
      success: true,
      previous: { quarter: current.quarter, schoolYear },
      current:  { quarter: nextQuarter,      schoolYear },
    });
  } catch (error: any) {
    console.error('POST /api/admin/academic-periods/advance:', error);
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function syncSystemSettings(supabase: any, schoolYear: string, quarter: number) {
  const upsert = async (key: string, value: string) => {
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
        .insert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() });
    }
  };

  await upsert('active_school_year', normalizeSchoolYear(schoolYear));
  await upsert('active_quarter', String(quarter));
}
