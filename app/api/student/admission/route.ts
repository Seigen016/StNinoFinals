import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get the student's email from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', studentId)
      .single();

    if (userError || !user?.email) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Fetch the latest approved admission matching this student's email
    const { data: admission } = await supabase
      .from('admissions')
      .select('intended_grade_level, previous_school, parent_name')
      .eq('email_address', user.email)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!admission) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        intendedGradeLevel: admission.intended_grade_level,
        previousSchool: admission.previous_school,
        parentName: admission.parent_name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
