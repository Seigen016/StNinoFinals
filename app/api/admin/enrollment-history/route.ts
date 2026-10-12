import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// GET /api/admin/enrollment-history?schoolYear=2024-2025&studentId=...
// Read-only view of archived enrollments (snapshotted before year-end unenrollment).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const studentId = searchParams.get('studentId');

    const admin = getSupabaseAdmin();
    let query = admin
      .from('enrollment_history')
      .select(
        `
        id,
        school_year,
        membership_type,
        archived_at,
        student:users!enrollment_history_user_id_fkey(id, first_name, last_name, student_number),
        class:classes!enrollment_history_class_id_fkey(id, class_name, class_code, grade_level, section)
      `
      )
      .order('archived_at', { ascending: false })
      .limit(2000);

    if (schoolYear) query = query.eq('school_year', schoolYear);
    if (studentId) query = query.eq('user_id', studentId);

    const { data, error } = await query;

    if (error) {
      console.error('Enrollment history GET error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: years } = await admin
      .from('enrollment_history')
      .select('school_year')
      .order('school_year', { ascending: false });

    const schoolYears = [...new Set((years || []).map((y: any) => y.school_year))];

    return NextResponse.json({ success: true, data: data || [], schoolYears });
  } catch (error: any) {
    console.error('Enrollment history GET unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
