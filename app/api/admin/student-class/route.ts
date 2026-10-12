import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/student-class?studentId=xxx
// Returns the class IDs a student is currently enrolled in (via user_classes)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_classes')
    .select('class_id, classes(id, class_name, grade_level, section, school_year)')
    .eq('user_id', studentId)
    .eq('membership_type', 'student');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const classIds = (data ?? []).map((row) => row.class_id).filter(Boolean);

  return NextResponse.json({ success: true, classIds });
}
