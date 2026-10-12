import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/sections/eligible-students?sectionId=...
// Returns all students matching the section's grade level who have no section
// assigned yet. Does NOT require an enrollment request — admin can manually
// assign any unplaced student of the right grade.
export async function GET(request: NextRequest) {
  const sectionId = request.nextUrl.searchParams.get('sectionId');
  if (!sectionId) {
    return NextResponse.json({ success: false, error: 'sectionId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Resolve the section
  const { data: section, error: secErr } = await supabase
    .from('sections')
    .select('id, name, grade_level, school_year')
    .eq('id', sectionId)
    .single();

  if (secErr || !section) {
    return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
  }

  // 2. Fetch all unplaced students — no grade level restriction.
  //    Admin can assign any student to any section manually.
  const { data: students, error: stuErr } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, section, grade_level')
    .eq('role', 'student')
    .is('section', null)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('last_name', { ascending: true });

  if (stuErr) {
    return NextResponse.json({ success: false, error: stuErr.message }, { status: 500 });
  }

  const eligible = (students ?? []).map((s: any) => ({
    studentId: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    email: s.email,
    gradeLevel: s.grade_level ?? null,
  }));

  return NextResponse.json({ success: true, students: eligible, section });
}
