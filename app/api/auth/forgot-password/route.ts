import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const admin = getSupabaseAdmin();

    // Check if user exists in the database first
    const { data: user } = await admin
      .from('users')
      .select('id, email')
      .ilike('email', emailLower)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this email address.',
        },
        { status: 404 }
      );
    }

    // User exists — send the reset email
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(emailLower, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      console.error('Reset password email error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A password reset link has been sent to your email.',
    });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
