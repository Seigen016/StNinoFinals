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

    // Fetch student info to get their grade level
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('grade_level, section')
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error('Error fetching student info:', studentError)
    }

    // Fetch active announcements
    // Filter by target audience (all, students, or specific grade level)
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('published_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: announcements, error } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({
        success: true,
        announcements: [],
        message: 'No announcements found',
      })
    }

    // Filter announcements based on target audience
    const filteredAnnouncements = announcements.filter((announcement) => {
      const targetAudience = announcement.target_audience
      if (!targetAudience || targetAudience === 'all') return true
      if (targetAudience === 'students') return true
      if (student && student.grade_level && targetAudience.includes(student.grade_level)) return true
      return false
    })

    // Format the announcements data
    const formattedAnnouncements = filteredAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      date: announcement.created_at,
      from: announcement.author_id, // You might want to join with users table to get author name
      priority: announcement.priority || 'medium',
    }))

    return NextResponse.json({
      success: true,
      announcements: formattedAnnouncements,
    })
  } catch (error: any) {
    console.error('Announcements API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
