import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gradeLevel = searchParams.get('gradeLevel');
  const schoolYear = searchParams.get('schoolYear');
  const archived = searchParams.get('archived') === 'true';

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('sections')
    .select('*')
    .eq('is_active', !archived)
    .order('grade_level')
    .order('name');

  if (gradeLevel) query = query.eq('grade_level', gradeLevel);
  if (schoolYear) query = query.eq('school_year', schoolYear);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const sections = data || [];
  if (sections.length === 0) {
    return NextResponse.json({ success: true, sections: [] });
  }

  const sectionIds = sections.map((s) => s.id);

  // Batch count classes and enrolled students for all sections in 2 queries.
  // Student count comes from users.section — this captures both request-based
  // and manual (batch) enrollments accurately.
  const sectionNames = sections.map((s) => s.name);

  const [{ data: classCounts }, { data: enrolledUsers }] = await Promise.all([
    supabase.from('classes').select('section_id').in('section_id', sectionIds),
    supabase
      .from('users')
      .select('section, grade_level')
      .eq('role', 'student')
      .in('section', sectionNames),
  ]);

  const classCountMap: Record<string, number> = {};
  const studentCountMap: Record<string, number> = {};

  for (const sec of sections) {
    classCountMap[sec.id] = (classCounts || []).filter((c) => c.section_id === sec.id).length;
    // Match by both name + grade_level in case two grades share a section name
    studentCountMap[sec.id] = (enrolledUsers || []).filter(
      (u) => u.section === sec.name && u.grade_level === sec.grade_level
    ).length;
  }

  const enriched = sections.map((s) => ({
    ...s,
    class_count: classCountMap[s.id] ?? 0,
    student_count: studentCountMap[s.id] ?? 0,
  }));

  return NextResponse.json({ success: true, sections: enriched });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gradeLevel, strand, schoolYear, maxCapacity = 45 } = body;

    if (!name || !gradeLevel || !schoolYear) {
      return NextResponse.json(
        { success: false, error: 'name, gradeLevel, and schoolYear are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('sections')
      .insert({
        name: name.trim(),
        grade_level: gradeLevel,
        strand: strand ?? null,
        school_year: schoolYear,
        max_capacity: Number(maxCapacity) || 45,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: `Section "${name}" already exists for ${gradeLevel} in ${schoolYear}` },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, section: { ...data, class_count: 0, student_count: 0 } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Archive or restore a section (does not touch enrollment/classes)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'id and is_active (boolean) are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sections')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, section: data });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Prevent deletion if students are enrolled
  const { count } = await supabase
    .from('enrollment_requests')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_section_id', id)
    .eq('status', 'approved');

  if (count && count > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${count} student(s) are enrolled in this section.` },
      { status: 409 }
    );
  }

  // Unlink classes before deleting
  await supabase.from('classes').update({ section_id: null }).eq('section_id', id);

  const { error } = await supabase.from('sections').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
