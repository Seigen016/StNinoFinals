import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all classes assigned to a teacher
export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Get all classes where teacher is assigned via user_classes
    const { data: userClasses, error: userClassesError } = await admin
      .from('user_classes')
      .select('class_id')
      .eq('user_id', teacherId)
      .eq('membership_type', 'teacher');

    if (userClassesError) {
      console.error('Error fetching user_classes:', userClassesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teacher classes' },
        { status: 500 }
      );
    }

    if (!userClasses || userClasses.length === 0) {
      return NextResponse.json({
        success: true,
        classes: [],
      });
    }

    const classIds = userClasses.map((uc) => uc.class_id);

    // Fetch class details
    const { data: classes, error: classesError } = await admin
      .from('classes')
      .select('*')
      .in('id', classIds)
      .eq('is_active', true)
      .order('school_year', { ascending: false })
      .order('quarter', { ascending: false });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch class details' },
        { status: 500 }
      );
    }

    // For each class, get enrolled students
    const classesWithStudents = await Promise.all(
      (classes || []).map(async (classItem) => {
        const { data: studentEnrollments } = await admin
          .from('user_classes')
          .select('user_id')
          .eq('class_id', classItem.id)
          .eq('membership_type', 'student');

        const studentIds = studentEnrollments?.map((se) => se.user_id) || [];
        let students: any[] = [];

        if (studentIds.length > 0) {
          const { data: studentsData } = await admin
            .from('users')
            .select(
              'id, first_name, last_name, student_number, grade_level, section'
            )
            .in('id', studentIds)
            .eq('role', 'student');
          students = studentsData || [];
        }

        return {
          ...classItem,
          school_year: normalizeSchoolYear(classItem.school_year),
          students,
          student_count: students.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: classesWithStudents,
    });
  } catch (error: any) {
    console.error('Teacher Classes API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
