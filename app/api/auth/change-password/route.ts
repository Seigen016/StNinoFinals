import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    // Get user from database to verify email
    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      password: currentPassword,
      email: user.email ?? '',
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password using admin client
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Clear the password_change_required flag — non-fatal if it fails
    const { error: flagError } = await supabaseAdmin
      .from('users')
      .update({ password_change_required: false })
      .eq('id', userId);

    if (flagError) {
      console.error('Failed to clear password change flag:', flagError);
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user needs to change password
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('[Change Password API] Checking for userId:', userId);

    if (!userId) {
      console.log('[Change Password API] No userId provided');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_change_required')
      .eq('id', userId)
      .single();

    console.log('[Change Password API] Query result:', { user, error });

    if (error) {
      console.error('[Change Password API] Database error:', error);
      return NextResponse.json(
        { success: false, error: `User not found: ${error.message}` },
        { status: 404 }
      );
    }

    if (!user) {
      console.log('[Change Password API] No user found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const passwordChangeRequired = user.password_change_required || false;
    console.log(
      '[Change Password API] Password change required:',
      passwordChangeRequired
    );

    return NextResponse.json({
      success: true,
      passwordChangeRequired: passwordChangeRequired,
    });
  } catch (error: any) {
    console.error('[Change Password API] Exception:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
