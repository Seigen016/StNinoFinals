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

    // Fetch grades from the database
    const { data: grades, error } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching grades:', error)
      return NextResponse.json({
        success: true,
        grades: [],
        message: 'No grades found',
      })
    }

    // Format the grades data
    const formattedGrades = grades.map((grade) => ({
      subject: grade.subject,
      grade: grade.grade.toString(),
      lastUpdated: grade.updated_at || grade.created_at,
    }))

    return NextResponse.json({
      success: true,
      grades: formattedGrades,
    })
  } catch (error: any) {
    console.error('Student grades API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
