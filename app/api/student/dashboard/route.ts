import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Run all independent queries in parallel
    const [gradesRes, attendanceRes, classesRes] = await Promise.all([
      supabase
        .from('grades')
        .select('id, subject, grade, status, updated_at, class_id')
        .eq('student_id', studentId),
      supabase
        .from('attendance_records')
        .select('id, status, time_in, created_at')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('user_classes')
        .select('class_id')
        .eq('user_id', studentId)
        .eq('membership_type', 'student'),
    ]);

    // ── GPA: average of approved grades ──────────────────────────────
    const approvedGrades = (gradesRes.data ?? []).filter(
      (g: any) => g.status === 'approved'
    );
    let gpa: number | null = null;
    if (approvedGrades.length > 0) {
      const sum = approvedGrades.reduce(
        (acc: number, g: any) => acc + parseFloat(g.grade ?? 0),
        0
      );
      gpa = parseFloat((sum / approvedGrades.length).toFixed(2));
    }

    // ── Attendance rate ───────────────────────────────────────────────
    const attendanceRecords = attendanceRes.data ?? [];
    let attendanceRate: number | null = null;
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(
        (r: any) => r.status?.toLowerCase() === 'present' && r.time_in != null
      ).length;
      attendanceRate = parseFloat(
        ((present / attendanceRecords.length) * 100).toFixed(1)
      );
    }

    // ── Classes / subjects ────────────────────────────────────────────
    const classIds = (classesRes.data ?? []).map((uc: any) => uc.class_id);
    let classes: any[] = [];
    if (classIds.length > 0) {
      const { data: classData } = await supabase
        .from('classes')
        .select(
          'id, class_name, class_code, grade_level, section, quarter, school_year, room, schedule, teacher_id, is_active'
        )
        .in('id', classIds);

      if (classData && classData.length > 0) {
        // enrich with teacher names
        const teacherIds = [
          ...new Set(classData.map((c: any) => c.teacher_id).filter(Boolean)),
        ];
        let teacherMap: Record<string, string> = {};
        if (teacherIds.length > 0) {
          const { data: teachers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', teacherIds);
          (teachers ?? []).forEach((t: any) => {
            teacherMap[t.id] = `${t.first_name} ${t.last_name}`.trim();
          });
        }
        classes = classData.map((c: any) => ({
          id: c.id,
          class_name: c.class_name,
          class_code: c.class_code,
          grade_level: c.grade_level,
          section: c.section,
          semester: c.quarter,
          school_year: c.school_year,
          room: c.room,
          schedule: c.schedule,
          teacher_name: c.teacher_id
            ? (teacherMap[c.teacher_id] ?? null)
            : null,
          is_active: c.is_active,
        }));
      }
    }

    // ── Grades with subject ───────────────────────────────────────────
    const gradesList = (gradesRes.data ?? []).map((g: any) => ({
      id: g.id,
      subject: g.subject,
      grade: g.grade,
      status: g.status,
      updatedAt: g.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          gpa,
          attendanceRate,
          activeCourses: classIds.length,
          approvedGrades: approvedGrades.length,
        },
        grades: gradesList,
        classes,
        recentAttendance: attendanceRecords.slice(0, 7).map((r: any) => ({
          date: r.created_at,
          timeIn: r.time_in,
          status: r.time_in ? 'present' : 'absent',
        })),
      },
    });
  } catch (error: any) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
