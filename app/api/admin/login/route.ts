import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const emailLower = email.toLowerCase().trim();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Email and password are required' },
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
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { ok: false, error: 'Login failed. Please try again.' },
        { status: 401 }
      );
    }

    // Query the users table specifically for this admin
    const { data: adminUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('role', 'admin')
      .single();

    if (error || !adminUser) {
      console.error('Admin profile error:', error);

      // Sign out if not an admin
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          ok: false,
          error:
            'No admin account found with this email. Please check your credentials.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: adminUser,
      userType: 'admin',
    });
  } catch (e: any) {
    console.error('Admin login error:', e);
    // Return 200 with error message instead of 500 to prevent Internal Server Error
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 200 } // Always return 200, never 500
    );
  }
}
