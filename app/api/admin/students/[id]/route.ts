import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, student: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      first_name,
      last_name,
      middle_name,
      student_number,
      grade_level,
      section,
      email,
      phone_number,
      date_of_birth,
      address,
      rfid,
    } = body

    const supabaseAdmin = getSupabaseAdmin()

    // Build update object with only defined values
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (middle_name !== undefined) updateData.middle_name = middle_name || null
    if (student_number !== undefined) updateData.student_number = student_number
    if (grade_level !== undefined) updateData.grade_level = grade_level
    if (section !== undefined) updateData.section = section || null
    if (email !== undefined) updateData.email = email
    if (phone_number !== undefined) updateData.phone_number = phone_number || null
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (address !== undefined) updateData.address = address || null
    if (rfid !== undefined) updateData.rfid = rfid || null

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('role', 'student')

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    // Update auth email if changed
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, { email })
    } catch (authError) {
      console.error('Failed to update auth email:', authError)
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdmin()

    // Delete from users table first
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'student')

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      )
    }

    // Delete auth user
    try {
      await supabaseAdmin.auth.admin.deleteUser(id)
    } catch (authError) {
      console.error('Failed to delete auth user:', authError)
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
