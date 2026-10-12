import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');

    if (!gradeId) {
      return NextResponse.json(
        { success: false, error: 'Missing gradeId parameter' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('grade_history')
      .select(
        `
        id,
        grade_value,
        status,
        rejection_reason,
        created_at,
        reviewer:users!grade_history_reviewed_by_fkey(first_name, last_name)
      `
      )
      .eq('grade_id', gradeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Grade history GET error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Grade history GET unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
