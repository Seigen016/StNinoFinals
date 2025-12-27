import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const section = searchParams.get('section')
    const quarter = searchParams.get('quarter')
    const subject = searchParams.get('subject')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Get teacher's classes
    let classesQuery = admin
      .from('classes')
      .select('id, class_name, section, grade_level')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (section) {
      classesQuery = classesQuery.eq('section', section)
    }

    const { data: classes, error: classesError } = await classesQuery

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch classes' },
        { status: 500 }
      )
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get students in these classes
    const classIds = classes.map(c => c.id)
    const { data: enrollments, error: enrollmentsError } = await admin
      .from('class_enrollments')
      .select('student_id, class_id')
      .in('class_id', classIds)
      .eq('status', 'active')

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      )
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    const { data: students, error: studentsError } = await admin
      .from('users')
      .select('id, first_name, last_name, student_number')
      .in('id', studentIds)
      .eq('role', 'student')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // Get existing grades for these students
    let gradesQuery = admin
      .from('grades')
      .select('*')
      .in('student_id', studentIds)

    if (subject) {
      gradesQuery = gradesQuery.eq('subject', subject)
    }

    const { data: existingGrades, error: gradesError } = await gradesQuery

    if (gradesError) {
      console.error('Error fetching grades:', gradesError)
      // Continue without grades rather than failing
    }

    // Format data for grades management
    const gradesData = students?.map(student => {
      const studentGrades = existingGrades?.filter(g => g.student_id === student.id) || []
      
      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        studentNumber: student.student_number,
        writtenWork: Array(5).fill(''), // Initialize empty
        performanceTasks: Array(5).fill(''),
        quarterlyAssessment: '',
        existingGrades: studentGrades // Include for reference
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: gradesData
    })
  } catch (error: any) {
    console.error('Teacher grades API error:', error)
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
    const { teacherId, subject, section, quarter, grades } = body

    if (!teacherId || !subject || !grades) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save grades to database
    const gradeRecords = []
    for (const studentGrade of grades) {
      // Calculate final grade based on the weighted components
      const writtenWorkScores = studentGrade.writtenWork
        .map((score: string) => parseFloat(score) || 0)
        .filter((score: number) => score > 0)
      const writtenWorkAvg = writtenWorkScores.length > 0
        ? writtenWorkScores.reduce((a: number, b: number) => a + b, 0) / writtenWorkScores.length
        : 0

      const performanceScores = studentGrade.performanceTasks
        .map((score: string) => parseFloat(score) || 0)
        .filter((score: number) => score > 0)
      const performanceAvg = performanceScores.length > 0
        ? performanceScores.reduce((a: number, b: number) => a + b, 0) / performanceScores.length
        : 0

      const quarterlyScore = parseFloat(studentGrade.quarterlyAssessment) || 0

      // Use the same weights as the UI
      const weights = getGradingWeights(subject)
      const finalGrade =
        (writtenWorkAvg * weights.writtenWork) / 100 +
        (performanceAvg * weights.performanceTasks) / 100 +
        (quarterlyScore * weights.quarterlyAssessment) / 100

      if (finalGrade > 0) {
        gradeRecords.push({
          student_id: studentGrade.id,
          subject: subject,
          grade: finalGrade,
          // You might want to store additional metadata like quarter, components, etc.
        })
      }
    }

    if (gradeRecords.length > 0) {
      const { error: insertError } = await admin
        .from('grades')
        .upsert(gradeRecords, { onConflict: 'student_id,subject' })

      if (insertError) {
        console.error('Error saving grades:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to save grades' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Grades saved successfully'
    })
  } catch (error: any) {
    console.error('Save grades API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get grading weights
function getGradingWeights(subject: string) {
  const subjectLower = subject?.toLowerCase() || ''
  
  if (
    subjectLower.includes('filipino') ||
    subjectLower.includes('english') ||
    subjectLower.includes('araling panlipunan') ||
    subjectLower.includes('ap') ||
    subjectLower.includes('esp') ||
    subjectLower.includes('edukasyon sa pagpapakatao') ||
    subjectLower.includes('mother tongue') ||
    subjectLower.includes('mt')
  ) {
    return { writtenWork: 30, performanceTasks: 50, quarterlyAssessment: 20 }
  }
  
  if (
    subjectLower.includes('science') ||
    subjectLower.includes('mathematics') ||
    subjectLower.includes('math')
  ) {
    return { writtenWork: 40, performanceTasks: 40, quarterlyAssessment: 20 }
  }
  
  if (
    subjectLower.includes('mapeh') ||
    subjectLower.includes('music') ||
    subjectLower.includes('arts') ||
    subjectLower.includes('physical education') ||
    subjectLower.includes('health') ||
    subjectLower.includes('epp') ||
    subjectLower.includes('tle') ||
    subjectLower.includes('technology') ||
    subjectLower.includes('livelihood') ||
    subjectLower.includes('elective') ||
    subjectLower.includes('writing')
  ) {
    return { writtenWork: 20, performanceTasks: 60, quarterlyAssessment: 20 }
  }
  
  return { writtenWork: 30, performanceTasks: 50, quarterlyAssessment: 20 }
}
