import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const teacherId = new URL(request.url).searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Missing teacherId' },
        { status: 400 }
      );
    }

    // Grade submission status breakdown for this teacher
    const { data: gradeRows } = await admin
      .from('grades')
      .select('status')
      .eq('teacher_id', teacherId);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const row of gradeRows ?? []) {
      const s = row.status as keyof typeof counts;
      if (s in counts) counts[s]++;
    }

    const gradeStatus = [
      { name: 'Pending', value: counts.pending, fill: '#f59e0b' },
      { name: 'Approved', value: counts.approved, fill: '#22c55e' },
      { name: 'Rejected', value: counts.rejected, fill: '#ef4444' },
    ];

    // Resolve classes via user_classes (source of truth for teacher assignment)
    const { data: teacherMemberships } = await admin
      .from('user_classes')
      .select('class_id')
      .eq('user_id', teacherId)
      .eq('membership_type', 'teacher');

    const classIds = (teacherMemberships ?? []).map((m) => m.class_id);

    let classes: any[] = [];
    if (classIds.length > 0) {
      const { data } = await admin
        .from('classes')
        .select('id, class_name')
        .in('id', classIds)
        .eq('is_active', true);
      classes = data ?? [];
    }

    const studentsPerClass = await Promise.all(
      classes.map(async (c: any) => {
        const { count } = await admin
          .from('user_classes')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', c.id)
          .eq('membership_type', 'student');
        return { class: c.class_name, students: count ?? 0 };
      })
    );

    return NextResponse.json({
      success: true,
      data: { gradeStatus, studentsPerClass },
    });
  } catch (error: any) {
    console.error('teacher chart-data error:', error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
