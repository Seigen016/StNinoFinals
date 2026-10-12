import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/sections/batch-enroll
// Assigns multiple students to a section in one operation.
// Mirrors the per-student approval flow exactly:
//   1. Resolve section → find all classes in it
//   2. Upsert user_classes for every class (membership_type='student')
//   3. Update users.grade_level + users.section
//   4. Mark enrollment_request.assigned_section_id
//   5. Grade 7+ → sever parent-student relationships
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, studentIds } = body as { sectionId: string; studentIds: string[] };

    if (!sectionId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sectionId and studentIds[] are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Resolve section
    const { data: section, error: secErr } = await supabase
      .from('sections')
      .select('id, name, grade_level, school_year, max_capacity')
      .eq('id', sectionId)
      .single();

    if (secErr || !section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Capacity check: count currently enrolled students
    const { count: currentCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('section', section.name)
      .eq('grade_level', section.grade_level);

    const available = (section.max_capacity ?? 0) - (currentCount ?? 0);
    if (available <= 0) {
      return NextResponse.json(
        { success: false, error: `Section "${section.name}" is already at full capacity (${section.max_capacity}).` },
        { status: 409 }
      );
    }
    if (studentIds.length > available) {
      return NextResponse.json(
        { success: false, error: `Only ${available} slot${available !== 1 ? 's' : ''} remaining in "${section.name}". You selected ${studentIds.length} students.` },
        { status: 409 }
      );
    }

    // 2. Find all classes belonging to this section
    let { data: classesBySectionId } = await supabase
      .from('classes')
      .select('id')
      .eq('section_id', sectionId);

    // Fallback: match by section name + grade_level + school_year (text join)
    if (!classesBySectionId || classesBySectionId.length === 0) {
      const { data: classesByName } = await supabase
        .from('classes')
        .select('id')
        .eq('section', section.name)
        .eq('grade_level', section.grade_level)
        .eq('school_year', section.school_year);
      classesBySectionId = classesByName ?? [];
    }

    const classIds = (classesBySectionId ?? []).map((c: any) => c.id);
    const gradeNum = parseInt(String(section.grade_level).replace(/\D/g, ''), 10);

    let enrolled = 0;
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        // 3. Upsert user_classes for every class in the section
        if (classIds.length > 0) {
          const rows = classIds.map((classId: string) => ({
            user_id: studentId,
            class_id: classId,
            membership_type: 'student',
          }));
          const { error: ucErr } = await supabase
            .from('user_classes')
            .upsert(rows, { onConflict: 'user_id,class_id', ignoreDuplicates: true });
          if (ucErr) throw new Error(ucErr.message);
        }

        // 4. Update users.grade_level + users.section
        const { error: userErr } = await supabase
          .from('users')
          .update({ grade_level: section.grade_level, section: section.name })
          .eq('id', studentId);
        if (userErr) throw new Error(userErr.message);

        // 5. Mark enrollment_request.assigned_section_id
        await supabase
          .from('enrollment_requests')
          .update({ assigned_section_id: sectionId })
          .eq('student_id', studentId)
          .eq('status', 'approved')
          .eq('school_year', section.school_year);

        // 6. Grade 7+ → remove parent-student relationships
        if (!isNaN(gradeNum) && gradeNum >= 7) {
          await supabase
            .from('user_relationships')
            .delete()
            .eq('related_user_id', studentId);
        }

        enrolled++;
      } catch (e: any) {
        errors.push(`Student ${studentId}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      enrolled,
      errors,
      message: `${enrolled} student${enrolled !== 1 ? 's' : ''} assigned to ${section.name}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
