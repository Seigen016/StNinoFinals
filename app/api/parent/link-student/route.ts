import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      parent_id,
      student_number,
      relationship_type,
    } = body

    if (!parent_id || !student_number) {
      return NextResponse.json(
        { success: false, error: 'Parent ID and Student Number are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Find student by student number
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, student_number, grade_level, section, email')
      .eq('student_number', student_number)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found with this student number' },
        { status: 404 }
      )
    }

    // Check if relationship already exists
    const { data: existing } = await supabaseAdmin
      .from('user_relationships')
      .select('id')
      .eq('user_id', parent_id)
      .eq('related_user_id', student.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This student is already linked to your account' },
        { status: 400 }
      )
    }

    // Create relationship
    const { error: insertError } = await supabaseAdmin
      .from('user_relationships')
      .insert({
        user_id: parent_id,
        related_user_id: student.id,
        relationship_type: relationship_type || 'parent',
        is_primary: false,
        can_pickup: true,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Student linked successfully',
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        student_number: student.student_number,
        grade_level: student.grade_level,
        section: student.section,
        email: student.email,
      }
    })
  } catch (error: any) {
    console.error('Link student error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
