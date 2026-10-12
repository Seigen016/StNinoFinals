import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [admissions, enrollments, grades] = await Promise.all([
      supabase
        .from('admissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('enrollment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        admissions: admissions.count || 0,
        enrollments: enrollments.count || 0,
        grades: grades.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Pending counts error:', error);
    return NextResponse.json({
      success: true,
      counts: { admissions: 0, enrollments: 0, grades: 0 },
    });
  }
}
