import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const GRADE_ORDER = [
  'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const school_year = searchParams.get('school_year') || null;
    const grade_level = searchParams.get('grade_level') || null;

    // Get all distinct school years for filter dropdown
    const { data: yearRows } = await admin
      .from('enrollment_requests')
      .select('school_year')
      .eq('status', 'approved');
    const schoolYears = [...new Set((yearRows || []).map((r: any) => normalizeSchoolYear(r.school_year)).filter(Boolean))].sort().reverse();

    // Build main query — match both normalized and bare-year formats in DB
    let query = admin
      .from('enrollment_requests')
      .select('grade_level')
      .eq('status', 'approved');

    if (school_year) {
      // Accept "2026-2027" and also match legacy bare "2026" records
      const bare = school_year.split('-')[0];
      query = query.in('school_year', [school_year, bare]);
    }
    if (grade_level) query = query.eq('grade_level', grade_level);

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Aggregate by grade level
    const map: Record<string, number> = {};
    (rows || []).forEach((row: any) => {
      const gl = row.grade_level || 'Unknown';
      map[gl] = (map[gl] || 0) + 1;
    });

    // Sort by grade order
    const byGrade = Object.entries(map)
      .map(([grade_level, total]) => ({ grade_level, total }))
      .sort((a, b) => {
        const ai = GRADE_ORDER.indexOf(a.grade_level);
        const bi = GRADE_ORDER.indexOf(b.grade_level);
        if (ai === -1 && bi === -1) return a.grade_level.localeCompare(b.grade_level);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

    const grandTotal = byGrade.reduce((s, r) => s + r.total, 0);

    return NextResponse.json({
      success: true,
      data: { byGrade, grandTotal, schoolYears },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
