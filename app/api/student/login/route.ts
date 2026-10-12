import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

const buildMockStudent = (email: string) => ({
  id: 0,
  email,
  name: 'Development Student',
  grade_level: 'Grade 10',
  section: 'A',
});

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const emailLower = email.toLowerCase().trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use Supabase Auth for login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: emailLower,
        password: password,
      });

    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Login failed. Please try again.' },
        { status: 401 }
      );
    }

    // Query the users table for student profile
    const { data: student, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('role', 'student')
      .single();

    if (profileError || !student) {
      console.error('Student profile error:', profileError);

      // Sign out if not a student
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error:
            'No student account found with this email. Please check your credentials.',
        },
        { status: 404 }
      );
    }

    // Build student name
    const studentName =
      `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim() ||
      'Student';

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        name: studentName,
      },
    });
  } catch (error: any) {
    console.error('Student login API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error. Please try again.',
      },
      { status: 500 }
    );
  }
}
