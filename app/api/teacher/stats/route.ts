import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({
        success: true,
        data: {
          totalStudents: 0,
          classesToday: 0,
          pendingGrades: 0,
          journalEntries: 0,
          todaySchedule: [],
          announcements: [],
        },
      })
    }

    // Get teacher's classes
    const { data: classes, error: classesError } = await admin
      .from('classes')
      .select('id, class_name, section, room, schedule')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (classesError) {
      console.error('Error fetching classes:', classesError)
    }

    // Get total students in teacher's classes
    let totalStudents = 0
    if (classes && classes.length > 0) {
      const classIds = classes.map(c => c.id)
      const { count, error: enrollmentError } = await admin
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .eq('status', 'active')

      if (!enrollmentError && count !== null) {
        totalStudents = count
      }
    }

    // Get today's schedule
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule: any[] = []
    
    if (classes) {
      classes.forEach(classInfo => {
        if (classInfo.schedule) {
          try {
            const scheduleData = typeof classInfo.schedule === 'string' 
              ? JSON.parse(classInfo.schedule) 
              : classInfo.schedule

            if (Array.isArray(scheduleData)) {
              scheduleData.forEach(item => {
                if (item.day === today) {
                  todaySchedule.push({
                    subject: classInfo.class_name,
                    section: classInfo.section,
                    room: classInfo.room,
                    timeStart: item.timeStart || item.start_time,
                    timeEnd: item.timeEnd || item.end_time
                  })
                }
              })
            } else if (typeof scheduleData === 'object' && scheduleData[today]) {
              const daySchedule = scheduleData[today]
              if (Array.isArray(daySchedule)) {
                daySchedule.forEach((timeSlot: any) => {
                  todaySchedule.push({
                    subject: classInfo.class_name,
                    section: classInfo.section,
                    room: classInfo.room,
                    timeStart: timeSlot.timeStart || timeSlot.start,
                    timeEnd: timeSlot.timeEnd || timeSlot.end
                  })
                })
              }
            }
          } catch (parseError) {
            console.error('Error parsing schedule:', parseError)
          }
        }
      })
    }

    // Sort today's schedule by time
    todaySchedule.sort((a, b) => a.timeStart.localeCompare(b.timeStart))

    // Get journal entries count
    const { count: journalCount } = await admin
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)

    // Get active announcements
    const { data: announcements } = await admin
      .from('announcements')
      .select('id, title, content, priority, published_at')
      .eq('is_active', true)
      .or('target_audience.eq.all,target_audience.eq.teachers')
      .lte('published_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: totalStudents,
        classesToday: todaySchedule.length,
        pendingGrades: 0, // Can be calculated if you track grade completion
        journalEntries: journalCount || 0,
        todaySchedule: todaySchedule,
        announcements: announcements || [],
      },
    })
  } catch (error: any) {
    console.error('Teacher stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
        data: {
          totalStudents: 0,
          classesToday: 0,
          pendingGrades: 0,
          journalEntries: 0,
          todaySchedule: [],
          announcements: [],
        },
      },
      { status: 500 }
    )
  }
}

