import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { success: false, error: 'parentId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get all children linked to this parent
    const { data: relationships } = await supabase
      .from('user_relationships')
      .select('related_user_id')
      .eq('user_id', parentId);

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const childIds = relationships.map((r: any) => r.related_user_id);

    // Get enrollment requests for all linked children
    const { data, error } = await supabase
      .from('enrollment_requests')
      .select('*')
      .in('student_id', childIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      parentId,
      studentId,
      gradeLevel,
      strand,
      schoolYear,
      enrollmentType = 'new',
      previousSchool,
    } = body;

    if (!parentId || !studentId || !gradeLevel || !schoolYear) {
      return NextResponse.json(
        {
          success: false,
          error: 'parentId, studentId, gradeLevel, and schoolYear are required',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify parent-child relationship
    const { data: relationship } = await supabase
      .from('user_relationships')
      .select('user_id')
      .eq('user_id', parentId)
      .eq('related_user_id', studentId)
      .maybeSingle();

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: no parent-child relationship found.',
        },
        { status: 403 }
      );
    }

    // Check for existing pending request for this student
    const { data: existing } = await supabase
      .from('enrollment_requests')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'This student already has a pending enrollment request.',
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .insert({
        student_id: studentId,
        submitted_by: parentId,
        grade_level: gradeLevel,
        strand: strand ?? null,
        school_year: normalizeSchoolYear(schoolYear),
        enrollment_type: enrollmentType,
        previous_school: previousSchool ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
