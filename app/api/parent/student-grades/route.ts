import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch only approved grades from the database
    const { data: grades, error } = await supabase
      .from('grades')
      .select('*, classes(school_year, quarter)')
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching grades:', error);
      return NextResponse.json({
        success: true,
        grades: [],
        message: 'No grades found',
      });
    }

    // Format the grades data
    const formattedGrades = grades.map((grade: any) => ({
      id: grade.id,
      subject: grade.subject,
      grade: grade.grade.toString(),
      status: grade.status ?? null,
      lastUpdated: grade.updated_at || grade.created_at,
      quarter: grade.quarter ?? grade.classes?.quarter ?? null,
      school_year: normalizeSchoolYear(grade.school_year ?? grade.classes?.school_year ?? '') || null,
    }));

    return NextResponse.json({
      success: true,
      grades: formattedGrades,
    });
  } catch (error: any) {
    console.error('Student grades API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
