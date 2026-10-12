import { normalizeGender } from '@/lib/gender';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

type GenderCounts = { male: number; female: number; unspecified: number };

function genderKey(raw: string | null | undefined): keyof GenderCounts {
  const g = normalizeGender(raw);
  return g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'unspecified';
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch students count
    const { count: studentsCount, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Fetch teachers count
    const { count: teachersCount, error: teachersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // Fetch parents count
    const { count: parentsCount, error: parentsError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'parent');

    if (studentsError || teachersError || parentsError) {
      console.error('Database error:', { studentsError, teachersError });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch stats',
          data: {
            totalStudents: 0,
            totalTeachers: 0,
            totalParents: 0,
            attendanceRate: 0,
          },
        },
        { status: 500 }
      );
    }

    // Attendance rate - use date range or default to today
    const attendanceStart = startDate || new Date().toISOString().split('T')[0];
    const attendanceEnd = endDate || attendanceStart;
    const totalStudents = studentsCount || 0;

    const { data: attendanceRecords, error: attendanceError } =
      await supabaseAdmin
        .from('attendance_records')
        .select('user_id')
        .gte('scan_datetime', `${attendanceStart}T00:00:00`)
        .lte('scan_datetime', `${attendanceEnd}T23:59:59`);

    let attendanceRate = 0;
    let attendanceCount = 0;
    if (!attendanceError && attendanceRecords && totalStudents > 0) {
      const uniqueStudents = new Set(
        attendanceRecords.map((record: any) => record.user_id)
      );
      attendanceCount = uniqueStudents.size;
      attendanceRate = Math.round((uniqueStudents.size / totalStudents) * 100);
    }

    // Fetch student population by grade level and section
    // Always show ALL students regardless of date range (population is not time-filtered)
    const { data: studentsList } = await supabaseAdmin
      .from('users')
      .select('grade_level, section, gender, created_at')
      .eq('role', 'student')
      .not('grade_level', 'is', null);

    const gradeDistribution: Record<string, number> = {};
    const sectionDistribution: Record<string, Record<string, number>> = {};
    // Same counts split by gender, for the male/female stacked charts
    const gradeGender: Record<string, GenderCounts> = {};
    const sectionGender: Record<string, Record<string, GenderCounts>> = {};

    if (studentsList) {
      for (const s of studentsList) {
        const rawGrade = (s.grade_level || '').trim();
        if (!rawGrade) continue; // Skip students with no grade level
        const grade = rawGrade;
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        const g = genderKey(s.gender);
        (gradeGender[grade] ??= { male: 0, female: 0, unspecified: 0 })[g]++;

        if (s.section) {
          if (!sectionDistribution[grade]) sectionDistribution[grade] = {};
          sectionDistribution[grade][s.section] = (sectionDistribution[grade][s.section] || 0) + 1;
          ((sectionGender[grade] ??= {})[s.section] ??= { male: 0, female: 0, unspecified: 0 })[g]++;
        }
      }
    }

    // Gender breakdown — across all students, independent of grade_level/date filters
    const { data: genderRows } = await supabaseAdmin
      .from('users')
      .select('gender')
      .eq('role', 'student');

    const genderBreakdown = { male: 0, female: 0, unspecified: 0 };
    for (const row of genderRows || []) genderBreakdown[genderKey(row.gender)]++;

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalParents: parentsCount || 0,
        attendanceRate,
        attendanceCount,
        gradeDistribution,
        sectionDistribution,
        gradeGender,
        sectionGender,
        genderBreakdown,
        filteredStudents: studentsList?.length || 0,
        dateRange: startDate || endDate ? { startDate: attendanceStart, endDate: attendanceEnd } : null,
      },
    });
  } catch (error: any) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
        data: {
          totalStudents: 0,
          totalTeachers: 0,
          totalParents: 0,
          attendanceRate: 0,
        },
      },
      { status: 500 }
    );
  }
}
