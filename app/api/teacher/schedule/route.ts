import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const date = searchParams.get('date')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Get teacher's classes with schedule info
    const { data: classes, error: classesError } = await admin
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (classesError) {
      console.error('Error fetching schedule:', classesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch schedule' },
        { status: 500 }
      )
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No schedule found for this teacher'
      })
    }

    // Parse schedule from JSON field if it exists
    // Schedule format: { "Monday": [{ "timeStart": "08:00", "timeEnd": "09:00" }], ... }
    const scheduleItems: any[] = []
    
    classes.forEach(classInfo => {
      if (classInfo.schedule) {
        try {
          const scheduleData = typeof classInfo.schedule === 'string' 
            ? JSON.parse(classInfo.schedule) 
            : classInfo.schedule

          // Handle different schedule formats
          if (Array.isArray(scheduleData)) {
            // If schedule is an array of items
            scheduleData.forEach(item => {
              scheduleItems.push({
                id: `${classInfo.id}-${item.day || ''}-${item.timeStart || ''}`,
                classId: classInfo.id,
                className: classInfo.class_name,
                subject: classInfo.class_name,
                section: classInfo.section || 'N/A',
                gradeLevel: classInfo.grade_level || 'N/A',
                room: classInfo.room || 'TBA',
                day: item.day,
                timeStart: item.timeStart || item.start_time,
                timeEnd: item.timeEnd || item.end_time,
                schoolYear: classInfo.school_year,
                semester: classInfo.semester
              })
            })
          } else if (typeof scheduleData === 'object') {
            // If schedule is an object with days as keys
            Object.entries(scheduleData).forEach(([day, times]: [string, any]) => {
              if (Array.isArray(times)) {
                times.forEach((timeSlot: any) => {
                  scheduleItems.push({
                    id: `${classInfo.id}-${day}-${timeSlot.timeStart || timeSlot.start}`,
                    classId: classInfo.id,
                    className: classInfo.class_name,
                    subject: classInfo.class_name,
                    section: classInfo.section || 'N/A',
                    gradeLevel: classInfo.grade_level || 'N/A',
                    room: classInfo.room || 'TBA',
                    day: day,
                    timeStart: timeSlot.timeStart || timeSlot.start,
                    timeEnd: timeSlot.timeEnd || timeSlot.end,
                    schoolYear: classInfo.school_year,
                    semester: classInfo.semester
                  })
                })
              }
            })
          }
        } catch (parseError) {
          console.error('Error parsing schedule for class:', classInfo.id, parseError)
        }
      } else {
        // If no schedule field, return basic class info
        scheduleItems.push({
          id: classInfo.id,
          classId: classInfo.id,
          className: classInfo.class_name,
          subject: classInfo.class_name,
          section: classInfo.section || 'N/A',
          gradeLevel: classInfo.grade_level || 'N/A',
          room: classInfo.room || 'TBA',
          day: 'TBA',
          timeStart: 'TBA',
          timeEnd: 'TBA',
          schoolYear: classInfo.school_year,
          semester: classInfo.semester
        })
      }
    })

    // Filter by date if provided
    let filteredSchedule = scheduleItems
    if (date) {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
      filteredSchedule = scheduleItems.filter(item => item.day === dayName)
    }

    // Sort by time
    filteredSchedule.sort((a, b) => {
      if (a.timeStart === 'TBA') return 1
      if (b.timeStart === 'TBA') return -1
      return a.timeStart.localeCompare(b.timeStart)
    })

    return NextResponse.json({
      success: true,
      data: filteredSchedule
    })
  } catch (error: any) {
    console.error('Teacher schedule API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
