import { getActivePeriod } from '@/lib/academic-period';
import { friendlyError } from '@/lib/error-message';
import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json(
      { success: false, error: 'studentId is required' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Only return a request that belongs to the current active school year.
  // Requests from past years are stale and must not influence the current UI.
  const activePeriod = await getActivePeriod();
  const activeSchoolYear = activePeriod?.schoolYear ?? null;

  if (!activeSchoolYear) {
    // No active school year — no enrollment request is relevant
    return NextResponse.json({ success: true, data: null });
  }

  const { data, error } = await supabase
    .from('enrollment_requests')
    .select('*')
    .eq('student_id', studentId)
    .eq('school_year', activeSchoolYear)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Enrollment request fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyError(
          error,
          'We could not load your enrollment request. Please refresh the page and try again.'
        ),
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      gradeLevel,
      strand,
      schoolYear,
      enrollmentType = 'new',
      previousSchool,
      previousGradesUrl,
    } = body;

    if (!studentId || !gradeLevel || !schoolYear) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Please select a grade level and school year before submitting your enrollment request.',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

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
          error: 'You already have a pending enrollment request.',
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('enrollment_requests')
      .insert({
        student_id: studentId,
        submitted_by: studentId,
        grade_level: gradeLevel,
        strand: strand ?? null,
        school_year: normalizeSchoolYear(schoolYear),
        enrollment_type: enrollmentType,
        previous_school: previousSchool ?? null,
        status: 'pending',
        previous_grades_url: previousGradesUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Enrollment request insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: friendlyError(
            error,
            'We could not submit your enrollment request. Please try again in a moment.'
          ),
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Enrollment request POST error:', e);
    return NextResponse.json(
      {
        success: false,
        error: friendlyError(
          e,
          'We could not submit your enrollment request. Please try again in a moment.'
        ),
      },
      { status: 500 }
    );
  }
}
