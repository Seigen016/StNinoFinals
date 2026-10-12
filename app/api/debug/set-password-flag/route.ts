import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// Temporary debug endpoint to test password change feature
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, value } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update the password_change_required flag
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_change_required: value !== false })
      .eq('id', userId);

    if (error) {
      console.error('Error updating password flag:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password change required flag set to ${value !== false} for user ${userId}`,
    });
  } catch (error: any) {
    console.error('Set password flag error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current flag value
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_change_required')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    console.error('Get password flag error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
