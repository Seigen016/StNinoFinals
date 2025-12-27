import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const section = searchParams.get('section')
    const gradeLevel = searchParams.get('gradeLevel')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Get teacher's classes
    let classesQuery = admin
      .from('classes')
      .select('id, section, grade_level, class_name, school_year')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (section) {
      classesQuery = classesQuery.eq('section', section)
    }
    if (gradeLevel) {
      classesQuery = classesQuery.eq('grade_level', gradeLevel)
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
        data: [],
        message: 'No classes found for this teacher'
      })
    }

    // Get students enrolled in these classes
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
        data: [],
        message: 'No students enrolled in these classes'
      })
    }

    // Get student details
    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    const { data: students, error: studentsError } = await admin
      .from('users')
      .select('id, first_name, last_name, middle_name, student_number, email, grade_level, section')
      .in('id', studentIds)
      .eq('role', 'student')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch student details' },
        { status: 500 }
      )
    }

    // Map students with their class info
    const studentsWithClasses = students?.map(student => {
      const studentEnrollments = enrollments.filter(e => e.student_id === student.id)
      const studentClasses = classes.filter(c => studentEnrollments.some(e => e.class_id === c.id))
      
      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        firstName: student.first_name,
        lastName: student.last_name,
        middleName: student.middle_name,
        studentNumber: student.student_number,
        email: student.email,
        gradeLevel: student.grade_level,
        section: student.section,
        classes: studentClasses
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: studentsWithClasses
    })
  } catch (error: any) {
    console.error('Teacher students API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
