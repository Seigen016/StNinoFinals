import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Fetch journal entries for this teacher
    const { data: journalEntries, error } = await admin
      .from('journal_entries')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch journal entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: journalEntries || []
    })
  } catch (error: any) {
    console.error('Teacher journal API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const body = await request.json()
    const { teacherId, date, subject, topic, activities, notes } = body

    if (!teacherId || !date || !subject || !topic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert journal entry
    const { data, error } = await admin
      .from('journal_entries')
      .insert({
        teacher_id: teacherId,
        date,
        subject,
        topic,
        activities,
        notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating journal entry:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create journal entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Journal entry created successfully'
    })
  } catch (error: any) {
    console.error('Create journal entry API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
