import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const section = searchParams.get('section');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const admin = getSupabaseAdmin();

    // Resolve teacher's class IDs via user_classes (source of truth)
    let teacherClassIds: string[] = [];
    let sections: string[] = [];

    if (teacherId) {
      const { data: memberships } = await admin
        .from('user_classes')
        .select('class_id')
        .eq('user_id', teacherId)
        .eq('membership_type', 'teacher');

      teacherClassIds = (memberships ?? []).map((m: any) => m.class_id);

      if (teacherClassIds.length > 0) {
        const { data: teacherClasses } = await admin
          .from('classes')
          .select('section')
          .in('id', teacherClassIds)
          .not('section', 'is', null);

        sections = [...new Set((teacherClasses ?? []).map((c: any) => c.section).filter(Boolean))].sort();
      }
    }

    const startISO = startDate
      ? `${startDate}T00:00:00.000Z`
      : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] + 'T00:00:00.000Z'; })();
    const endISO = endDate
      ? `${endDate}T23:59:59.999Z`
      : new Date().toISOString().split('T')[0] + 'T23:59:59.999Z';

    // Get student IDs enrolled in teacher's classes
    let studentIds: string[] | null = null;
    if (teacherClassIds.length > 0) {
      const { data: enrolled } = await admin
        .from('user_classes')
        .select('user_id')
        .in('class_id', teacherClassIds)
        .eq('membership_type', 'student');

      if (enrolled && enrolled.length > 0) {
        studentIds = [...new Set(enrolled.map((e: any) => e.user_id))];
      } else {
        return NextResponse.json({ success: true, records: [], sections });
      }
    } else if (teacherId) {
      // Teacher has no classes assigned
      return NextResponse.json({ success: true, records: [], sections });
    }

    let query = admin
      .from('attendance_records')
      .select(`
        id,
        scan_time,
        status,
        users!attendance_records_user_id_fkey (
          id,
          first_name,
          last_name,
          student_number,
          grade_level,
          section,
          role
        )
      `)
      .gte('scan_time', startISO)
      .lte('scan_time', endISO)
      .eq('users.role', 'student')
      .order('scan_time', { ascending: false });

    if (studentIds) {
      query = query.in('user_id', studentIds);
    }
    if (section && section !== 'all') {
      query = query.eq('users.section', section);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const records = (data || [])
      .filter((r: any) => r.users)
      .map((r: any) => ({
        id: r.id,
        scan_time: r.scan_time,
        status: r.status || 'present',
        student_name: `${r.users.first_name} ${r.users.last_name}`,
        student_number: r.users.student_number,
        grade_level: r.users.grade_level,
        section: r.users.section,
      }));

    const extraSections = records.map((r: any) => r.section).filter(Boolean);
    const allSections = [...new Set([...sections, ...extraSections])].sort();

    return NextResponse.json({ success: true, records, sections: allSections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
