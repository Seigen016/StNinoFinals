import { getActivePeriod } from '@/lib/academic-period';
import { getActiveSchoolYear, normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// GET /api/admin/school-years → every school year with academic periods, plus
// the year after the active one (so next year's sections can be prepared),
// newest first, and which one is active.
export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin().from('academic_periods').select('school_year');
    if (error) throw error;

    const active = (await getActivePeriod())?.schoolYear ?? getActiveSchoolYear();
    const nextStart = parseInt(active.slice(0, 4), 10) + 1;
    const years = new Set([
      ...(data ?? []).map((r) => normalizeSchoolYear(r.school_year)),
      active,
      `${nextStart}-${nextStart + 1}`,
    ]);

    return NextResponse.json({
      success: true,
      years: [...years].sort().reverse(),
      active,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
