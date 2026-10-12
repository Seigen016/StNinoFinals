import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '30')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: attendanceRecords, error } = await admin
      .from('attendance_records')
      .select('id, scan_time, status, scan_type')
      .eq('user_id', studentId)
      .gte('scan_time', startDate.toISOString())
      .order('scan_time', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: true,
        attendance: [],
        message: 'No attendance records found',
      })
    }

    const formattedAttendance = (attendanceRecords || [])
      .filter((record) => record.scan_time)
      .map((record) => {
        const dt = new Date(record.scan_time!)
        return {
          date: record.scan_time,
          status: record.status || 'present',
          time: dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
          scan_type: record.scan_type || 'timein',
        }
      })

    return NextResponse.json({
      success: true,
      attendance: formattedAttendance,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
