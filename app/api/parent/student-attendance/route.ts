import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const days = parseInt(searchParams.get('days') || '7')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Calculate the date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch attendance records from the database
    const { data: attendanceRecords, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', studentId)
      .gte('scan_datetime', startDate.toISOString())
      .order('scan_datetime', { ascending: false })

    if (error) {
      console.error('Error fetching attendance:', error)
      // Return empty attendance if table doesn't exist or error occurs
      return NextResponse.json({
        success: true,
        attendance: [],
        message: 'No attendance records found',
      })
    }

    // Format the attendance data
    const formattedAttendance = attendanceRecords.map((record) => ({
      date: record.scan_datetime,
      status: record.status,
      time: record.time_in || record.scan_datetime,
      timeIn: record.time_in,
      timeOut: record.time_out,
    }))

    return NextResponse.json({
      success: true,
      attendance: formattedAttendance,
    })
  } catch (error: any) {
    console.error('Student attendance API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
