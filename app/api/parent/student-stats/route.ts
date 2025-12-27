import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Fetch grades to calculate GPA
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('grade')
      .eq('student_id', studentId)

    let gpa = 0
    if (!gradesError && grades && grades.length > 0) {
      const total = grades.reduce((sum, g) => sum + g.grade, 0)
      gpa = total / grades.length
    }

    // Fetch attendance records to calculate attendance rate
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('user_id', studentId)

    let attendanceRate = 0
    if (!attendanceError && attendanceRecords && attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(
        (record) => record.status === 'present' || record.status === 'late'
      ).length
      attendanceRate = (presentCount / attendanceRecords.length) * 100
    }

    // Fetch pending tasks/assignments (if you have an assignments table)
    // For now, we'll set it to 0 or fetch from a different source
    const pendingTasks = 0

    // Behavior score (if you have a behavior tracking system)
    // For now, we'll calculate based on attendance and punctuality
    let behaviorScore = 85
    if (attendanceRecords && attendanceRecords.length > 0) {
      const lateCount = attendanceRecords.filter((record) => record.status === 'late').length
      const absentCount = attendanceRecords.filter((record) => record.status === 'absent').length
      behaviorScore = Math.max(0, 100 - (lateCount * 2) - (absentCount * 5))
    }

    return NextResponse.json({
      success: true,
      stats: {
        gpa: parseFloat(gpa.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        behaviorScore: parseFloat(behaviorScore.toFixed(2)),
        pendingTasks,
      },
    })
  } catch (error: any) {
    console.error('Student stats API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
