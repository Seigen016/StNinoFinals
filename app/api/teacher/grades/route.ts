import { getActivePeriod } from '@/lib/academic-period';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');

    if (!teacherId || !classId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      );
    }

    // Get students enrolled in this class from user_classes
    const { data: enrollments, error: enrollmentsError } = await admin
      .from('user_classes')
      .select('user_id')
      .eq('class_id', classId)
      .eq('membership_type', 'student');

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const studentIds = enrollments.map((e) => e.user_id);
    const { data: students, error: studentsError } = await admin
      .from('users')
      .select('id, first_name, last_name, student_number')
      .in('id', studentIds)
      .eq('role', 'student');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // Get existing grades for these students
    let gradesQuery = admin
      .from('grades')
      .select('*')
      .in('student_id', studentIds);

    if (subject) {
      gradesQuery = gradesQuery.eq('subject', subject);
    }

    // Only the active quarter is editable; earlier quarters stay on record
    const activePeriod = await getActivePeriod();
    if (activePeriod) {
      gradesQuery = gradesQuery.eq('quarter', activePeriod.quarter);
    }

    const { data: existingGrades, error: gradesError } = await gradesQuery;

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      // Continue without grades rather than failing
    }

    // Format data for grades management
    const gradesData =
      students?.map((student) => {
        const studentGrade = existingGrades?.find(
          (g) => g.student_id === student.id
        );

        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          studentId: student.student_number,
          grade: studentGrade?.grade?.toString() || '',
          status: studentGrade?.status ?? null,
          gradeId: studentGrade?.id ?? null,
          reviewedAt: studentGrade?.reviewed_at ?? null,
          rejectionReason: studentGrade?.rejection_reason ?? null,
        };
      }) || [];

    return NextResponse.json({
      success: true,
      data: gradesData,
    });
  } catch (error: any) {
    console.error('Teacher grades API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Note: grade submission goes through POST /api/grades (validated 0-100 range),
// not this route. A duplicate, unvalidated POST handler used to live here —
// removed since nothing calls it (see app/teacher/grades/page.tsx, which only
// uses this route's GET to pre-fill the entry form).
