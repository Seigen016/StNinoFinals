import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const [
      { count: students },
      { count: teachers },
      { count: classes },
    ] = await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      admin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      (admin as any).from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        students: students ?? 0,
        teachers: teachers ?? 0,
        classes: classes ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
