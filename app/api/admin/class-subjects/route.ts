import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  if (!classId) {
    return NextResponse.json(
      { success: false, error: 'classId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('class_subjects')
      .select('id, subject_name, created_at')
      .eq('class_id', classId)
      .order('subject_name');

    if (error) throw error;

    return NextResponse.json({ success: true, subjects: data || [] });
  } catch (error: any) {
    console.error('GET /api/admin/class-subjects error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, subjectName } = body;

    if (!classId || !subjectName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'classId and subjectName are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('class_subjects')
      .insert({ class_id: classId, subject_name: subjectName.trim() })
      .select('id, subject_name, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Subject already exists in this class' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, subject: data });
  } catch (error: any) {
    console.error('POST /api/admin/class-subjects error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'id is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/class-subjects error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
