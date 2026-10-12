import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentNumber = searchParams.get('studentNumber');

    if (!studentNumber) {
      return NextResponse.json(
        { success: false, error: 'Student number is required' },
        { status: 400 }
      );
    }

    // Query student from users table where role = 'student'
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, student_number, grade_level, section')
      .eq('student_number', studentNumber)
      .eq('role', 'student')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: data,
    });
  } catch (error: any) {
    console.error('Students API GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const studentData = await request.json();

    // This endpoint is deprecated - use /api/admin/students instead
    return NextResponse.json(
      {
        success: false,
        error:
          'This endpoint is deprecated. Please use /api/admin/students to create student accounts.',
      },
      { status: 410 } // 410 Gone
    );
  } catch (error: any) {
    console.error('Students API POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
