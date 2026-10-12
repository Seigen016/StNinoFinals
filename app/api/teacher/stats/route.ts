import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

const DAY_CODE: Record<string, string> = {
  Sunday: 'Su',
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'Th',
  Friday: 'F',
  Saturday: 'Sa',
}

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
          totalClasses: 0,
          pendingGrades: 0,
          todaySchedule: [],
          announcements: [],
        },
      })
    }

    // Resolve teacher's class IDs via user_classes (source of truth)
    const { data: teacherMemberships } = await admin
      .from('user_classes')
      .select('class_id')
      .eq('user_id', teacherId)
      .eq('membership_type', 'teacher')

    const classIds = (teacherMemberships ?? []).map((m) => m.class_id)

    let classes: any[] = []
    if (classIds.length > 0) {
      const { data } = await admin
        .from('classes')
        .select('id, class_name, section, room, schedule')
        .in('id', classIds)
        .eq('is_active', true)
      classes = data ?? []
    }

    // Total unique students across all teacher classes
    let totalStudents = 0
    const activeClassIds = classes.map((c) => c.id)
    if (activeClassIds.length > 0) {
      const { data: enrollments } = await admin
        .from('user_classes')
        .select('user_id')
        .in('class_id', activeClassIds)
        .eq('membership_type', 'student')

      totalStudents = new Set((enrollments ?? []).map((e) => e.user_id)).size
    }

    // Pending grades submitted by this teacher awaiting admin review
    const { count: pendingGrades } = await admin
      .from('grades')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'pending')

    // Today's schedule — compare using short day codes ("M", "T", "W", "Th", "F")
    const todayFull = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayCode = DAY_CODE[todayFull] ?? todayFull
    const todaySchedule: any[] = []

    for (const classInfo of classes) {
      if (!classInfo.schedule) continue
      try {
        const scheduleData =
          typeof classInfo.schedule === 'string'
            ? JSON.parse(classInfo.schedule)
            : classInfo.schedule

        if (Array.isArray(scheduleData)) {
          scheduleData
            .filter((item: any) => item.day === todayCode)
            .forEach((item: any) => {
              todaySchedule.push({
                subject: classInfo.class_name,
                section: classInfo.section,
                room: classInfo.room,
                timeStart: item.start ?? item.timeStart ?? item.start_time,
                timeEnd: item.end ?? item.timeEnd ?? item.end_time,
              })
            })
        }
      } catch {
        // malformed schedule JSON — skip
      }
    }

    todaySchedule.sort((a, b) =>
      (a.timeStart ?? '').localeCompare(b.timeStart ?? '')
    )

    // Active announcements targeting teachers or all roles
    const { data: announcements } = await admin
      .from('announcements')
      .select('id, title, content, priority, published_at')
      .eq('is_active', true)
      .or('target_audience.eq.all,target_audience.eq.teachers')
      .lte('published_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalClasses: activeClassIds.length,
        pendingGrades: pendingGrades ?? 0,
        todaySchedule,
        announcements: announcements ?? [],
      },
    })
  } catch (error: any) {
    console.error('Teacher stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Internal server error',
        data: {
          totalStudents: 0,
          totalClasses: 0,
          pendingGrades: 0,
          todaySchedule: [],
          announcements: [],
        },
      },
      { status: 500 }
    )
  }
}
