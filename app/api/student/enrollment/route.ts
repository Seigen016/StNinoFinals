import { getActivePeriod, getSemesterLabel } from '@/lib/academic-period';
import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select(
        'id, first_name, last_name, student_number, grade_level, section, email, enrollment_date, status'
      )
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'We could not find your student record. Please contact the school administrator.' },
        { status: 404 }
      );
    }

    // Get classes the student is enrolled in
    const { data: userClasses, error: userClassesError } = await supabase
      .from('user_classes')
      .select('class_id, created_at')
      .eq('user_id', studentId)
      .eq('membership_type', 'student');

    if (userClassesError) {
      return NextResponse.json(
        { success: false, error: 'We could not load your enrollment details right now. Please try again in a moment.' },
        { status: 500 }
      );
    }

    if (!userClasses || userClasses.length === 0) {
      // If the student already has a section assigned (set during enrollment
      // approval), treat them as enrolled even without a user_classes row.
      // This covers the case where approval set grade_level+section but the
      // specific class link wasn't created yet.
      if (student.section) {
        const activePeriod = await getActivePeriod();
        return NextResponse.json({
          success: true,
          data: {
            student: {
              name: `${student.first_name} ${student.last_name}`.trim(),
              studentNumber: student.student_number,
              gradeLevel: student.grade_level,
              section: student.section,
              enrollmentDate: student.enrollment_date,
              status: student.status,
            },
            enrollment: {
              schoolYear: activePeriod?.schoolYear ?? null,
              semester: null,
              isEnrolled: true,
              isPendingClass: false,
            },
            classes: [],
          },
        });
      }

      // No user_classes = not enrolled. Only show "pending class" state if
      // there is an active school year AND an approved request for that year.
      // If no active school year exists, the previous year has ended and the
      // student must re-enroll — never carry over stale approved requests.
      const activePeriod = await getActivePeriod();
      const activeSchoolYear = activePeriod?.schoolYear ?? null;

      let isPendingClass = false;
      if (activeSchoolYear) {
        const { data: approvedReq } = await supabase
          .from('enrollment_requests')
          .select('id')
          .eq('student_id', studentId)
          .eq('status', 'approved')
          .eq('school_year', activeSchoolYear)
          .limit(1)
          .maybeSingle();
        isPendingClass = !!approvedReq;
      }

      return NextResponse.json({
        success: true,
        data: {
          student: {
            name: `${student.first_name} ${student.last_name}`.trim(),
            studentNumber: student.student_number,
            gradeLevel: student.grade_level,
            section: student.section,
            enrollmentDate: student.enrollment_date,
            status: student.status,
          },
          enrollment: {
            schoolYear: activeSchoolYear,
            semester: null,
            isEnrolled: false,
            isPendingClass,
          },
          classes: [],
        },
      });
    }

    const classIds = userClasses.map((uc) => uc.class_id);

    // Get class details with teacher info
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(
        'id, class_name, class_code, grade_level, section, quarter, school_year, room, schedule, is_active, teacher_id'
      )
      .in('id', classIds);

    if (classesError) {
      return NextResponse.json(
        { success: false, error: 'We could not load your subjects right now. Please try again in a moment.' },
        { status: 500 }
      );
    }

    // Get unique teacher IDs
    const teacherIds = [
      ...new Set(
        (classes || [])
          .map((c) => c.teacher_id)
          .filter((id): id is string => !!id)
      ),
    ];

    // Fetch teacher names
    let teacherMap: Record<string, string> = {};
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', teacherIds);

      if (teachers) {
        teacherMap = Object.fromEntries(
          teachers.map((t) => [t.id, `${t.first_name} ${t.last_name}`.trim()])
        );
      }
    }

    // Determine current school year from active classes
    const activeClasses = (classes || []).filter((c) => c.is_active);
    const primaryClass =
      activeClasses.length > 0 ? activeClasses[0] : classes?.[0];

    // Build per-class semester label using the student's grade level
    const makeSemesterLabel = (quarter: number | null | undefined, gradeLevel: string | null): string | null => {
      if (!quarter) return null;
      return getSemesterLabel(quarter, gradeLevel ?? '');
    };

    const formattedClasses = (classes || []).map((cls) => ({
      id: cls.id,
      className: cls.class_name,
      classCode: cls.class_code,
      gradeLevel: cls.grade_level,
      section: cls.section,
      semester: makeSemesterLabel((cls as any).quarter, cls.grade_level),
      schoolYear: normalizeSchoolYear(cls.school_year),
      room: cls.room,
      schedule: cls.schedule,
      isActive: cls.is_active,
      teacher: cls.teacher_id ? teacherMap[cls.teacher_id] || 'TBD' : 'TBD',
    }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          name: `${student.first_name} ${student.last_name}`.trim(),
          studentNumber: student.student_number,
          gradeLevel: student.grade_level,
          section: student.section,
          enrollmentDate: student.enrollment_date,
          status: student.status,
        },
        enrollment: {
          schoolYear: primaryClass ? normalizeSchoolYear(primaryClass.school_year) : null,
          // semester is kept for backward compat but enrollment is annual — display just shows AY
          semester: makeSemesterLabel((primaryClass as any)?.quarter ?? null, student.grade_level),
          isEnrolled: formattedClasses.length > 0,
        },
        classes: formattedClasses,
      },
    });
  } catch (error) {
    console.error('Enrollment API error:', error);
    return NextResponse.json(
      { success: false, error: 'We could not load your enrollment details right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
