import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/sections/batch-remove
// Removes students from a section: clears users.section, deletes user_classes
// for classes in that section, and clears enrollment_request.assigned_section_id.
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

    const { data: section, error: secErr } = await supabase
      .from('sections')
      .select('id, name, grade_level, school_year')
      .eq('id', sectionId)
      .single();

    if (secErr || !section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Find all classes belonging to this section
    let { data: classesBySectionId } = await supabase
      .from('classes')
      .select('id')
      .eq('section_id', sectionId);

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

    let removed = 0;
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        // 1. Delete user_classes rows for this section's classes
        if (classIds.length > 0) {
          const { error: ucErr } = await supabase
            .from('user_classes')
            .delete()
            .eq('user_id', studentId)
            .in('class_id', classIds);
          if (ucErr) throw new Error(ucErr.message);
        }

        // 2. Clear users.section (keep grade_level intact)
        const { error: userErr } = await supabase
          .from('users')
          .update({ section: null })
          .eq('id', studentId);
        if (userErr) throw new Error(userErr.message);

        // 3. Clear enrollment_request.assigned_section_id (best-effort)
        await supabase
          .from('enrollment_requests')
          .update({ assigned_section_id: null })
          .eq('student_id', studentId)
          .eq('assigned_section_id', sectionId);

        removed++;
      } catch (e: any) {
        errors.push(`Student ${studentId}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      removed,
      errors,
      message: `${removed} student${removed !== 1 ? 's' : ''} removed from ${section.name}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
