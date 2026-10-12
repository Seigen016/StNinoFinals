import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch active classes with section and grade level
    const { data: classesData, error: classError } = await supabase
      .from('classes')
      .select('id, grade_level, section')
      .eq('is_active', true);

    if (classError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    if (!classesData || classesData.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch all user_classes that are students
    const classIds = classesData.map((c) => c.id);
    const { data: userClasses, error: ucError } = await supabase
      .from('user_classes')
      .select('user_id, class_id')
      .in('class_id', classIds)
      .eq('membership_type', 'student');

    if (ucError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    const studentIds = [...new Set(userClasses?.map((uc) => uc.user_id) || [])];

    let studentsData: any[] = [];
    if (studentIds.length > 0) {
      const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, first_name, last_name, middle_name, student_number, email')
        .in('id', studentIds);

      if (!studentError && students) {
        studentsData = students;
      }
    }

    // Now construct the response grouping by Grade -> Section -> Students
    const studentMap = new Map(studentsData.map((s) => [s.id, s]));

    const classWithStudentsMap = new Map();
    userClasses?.forEach((uc) => {
      if (!classWithStudentsMap.has(uc.class_id)) {
        classWithStudentsMap.set(uc.class_id, []);
      }
      const student = studentMap.get(uc.user_id);
      if (student) {
        classWithStudentsMap.get(uc.class_id).push(student);
      }
    });

    const grouped: Record<string, Record<string, any[]>> = {};

    classesData.forEach((c) => {
      const grade = c.grade_level || 'Unassigned Grade';
      const section = c.section || 'Unassigned Section';

      if (!grouped[grade]) {
        grouped[grade] = {};
      }

      if (!grouped[grade][section]) {
        grouped[grade][section] = [];
      }

      const studentsInClass = classWithStudentsMap.get(c.id) || [];
      // To prevent showing dupes if multiple classes share a section/grade pair
      studentsInClass.forEach((st: any) => {
        if (!grouped[grade][section].find((s: any) => s.id === st.id)) {
          grouped[grade][section].push(st);
        }
      });
    });

    // Formatting as an array structure
    const data = Object.keys(grouped)
      .map((grade) => {
        const sections = Object.keys(grouped[grade])
          .map((section) => {
            // Sort students alphabetically
            const students = [...grouped[grade][section]].sort((a, b) =>
              (a.last_name || '').localeCompare(b.last_name || '')
            );

            return {
              section,
              students,
            };
          })
          .sort((a, b) => a.section.localeCompare(b.section));

        return {
          grade,
          sections,
        };
      })
      .sort((a, b) => {
        // Basic grade sorting: Grade 1, Grade 2, ... Grade 12
        const numA = parseInt(a.grade.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.grade.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.grade.localeCompare(b.grade);
      });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Class List error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
