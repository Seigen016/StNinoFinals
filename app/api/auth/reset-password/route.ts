import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error('Password reset error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Clear the password_change_required flag
    await supabaseAdmin
      .from('users')
      .update({ password_change_required: false })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
