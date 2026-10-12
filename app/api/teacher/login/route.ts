import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const emailLower = email.toLowerCase().trim();

    // Validate input
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

    // Query the users table specifically for this teacher
    const { data: teacher, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('role', 'teacher')
      .single();

    if (error || !teacher) {
      console.error('Teacher profile error:', error);

      // Sign out if not a teacher
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error:
            'No teacher account found with this email. Please check your credentials.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher: teacher,
    });
  } catch (e: any) {
    console.error('Teacher login error:', e);
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
