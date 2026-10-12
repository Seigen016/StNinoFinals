import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/sections/enrolled-students?sectionId=...
// Returns all students currently assigned to this section.
export async function GET(request: NextRequest) {
  const sectionId = request.nextUrl.searchParams.get('sectionId');
  if (!sectionId) {
    return NextResponse.json({ success: false, error: 'sectionId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: section, error: secErr } = await supabase
    .from('sections')
    .select('id, name, grade_level, school_year')
    .eq('id', sectionId)
    .single();

  if (secErr || !section) {
    return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
  }

  const { data: students, error: stuErr } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, grade_level')
    .eq('role', 'student')
    .eq('section', section.name)
    .eq('grade_level', section.grade_level)
    .order('last_name', { ascending: true });

  if (stuErr) {
    return NextResponse.json({ success: false, error: stuErr.message }, { status: 500 });
  }

  const enrolled = (students ?? []).map((s: any) => ({
    studentId: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    gradeLevel: s.grade_level ?? null,
  }));

  return NextResponse.json({ success: true, students: enrolled, section });
}
