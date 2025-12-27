import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch students count
    const { count: studentsCount, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')

    // Fetch teachers count
    const { count: teachersCount, error: teachersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher')

    // Fetch parents count
    const { count: parentsCount, error: parentsError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'parent')

    if (studentsError || teachersError || parentsError) {
      console.error('Database error:', { studentsError, teachersError })
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch stats',
        data: {
          totalStudents: 0,
          totalTeachers: 0,
          totalParents: 0,
          attendanceRate: 0,
        },
      }, { status: 500 })
    }

    // Calculate today's attendance rate
    const today = new Date().toISOString().split('T')[0]
    
    // Get total students for attendance calculation
    const totalStudents = studentsCount || 0
    
    // Get today's attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('student_id')
      .gte('scanned_at', `${today}T00:00:00`)
      .lte('scanned_at', `${today}T23:59:59`)

    let attendanceRate = 0
    if (!attendanceError && attendanceRecords && totalStudents > 0) {
      // Count unique students who attended today
      const uniqueStudents = new Set(attendanceRecords.map((record: any) => record.student_id))
      attendanceRate = Math.round((uniqueStudents.size / totalStudents) * 100)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalParents: parentsCount || 0,
        attendanceRate,
      },
    })
  } catch (error: any) {
    console.error('Admin stats API error:', error)
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
    )
  }
}

