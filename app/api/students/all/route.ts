import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      // If no teacherId provided, return all students
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, first_name, last_name, student_number, grade_level, section'
        )
        .eq('role', 'student')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch students' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        students: data || [],
      });
    }

    // Get teacher's classes from user_classes table
    const { data: teacherClasses, error: classesError } = await supabase
      .from('user_classes')
      .select('class_id')
      .eq('user_id', teacherId);

    if (classesError) {
      console.error('Error fetching teacher classes:', classesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teacher classes' },
        { status: 500 }
      );
    }

    if (!teacherClasses || teacherClasses.length === 0) {
      // Teacher has no classes, return empty array
      return NextResponse.json({
        success: true,
        students: [],
      });
    }

    const classIds = teacherClasses.map((tc) => tc.class_id);

    // Get students enrolled in those classes from user_classes table
    const { data: studentClasses, error: studentClassesError } = await supabase
      .from('user_classes')
      .select('user_id')
      .in('class_id', classIds);

    if (studentClassesError) {
      console.error('Error fetching student classes:', studentClassesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student classes' },
        { status: 500 }
      );
    }

    if (!studentClasses || studentClasses.length === 0) {
      // No students in teacher's classes
      return NextResponse.json({
        success: true,
        students: [],
      });
    }

    // Get unique student IDs
    const studentIds = [...new Set(studentClasses.map((sc) => sc.user_id))];

    // Fetch student details
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, student_number, grade_level, section')
      .in('id', studentIds)
      .eq('role', 'student')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      students: data || [],
    });
  } catch (error: any) {
    console.error('Students API GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
