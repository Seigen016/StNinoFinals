import { NAME_FIELDS, nameCaseFields } from '@/lib/person';
import { normalizeGender } from '@/lib/gender'
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
      .eq('role', 'teacher')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, teacher: data })
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
    const body = nameCaseFields(await request.json(), NAME_FIELDS)
    const {
      first_name,
      last_name,
      middle_name,
      suffix,
      employee_number,
      department,
      specialization,
      email,
      phone_number,
      date_of_birth,
      date_hired,
      address,
      rfid,
      gender,
    } = body

    const supabaseAdmin = getSupabaseAdmin()

    // Build update object with only defined values
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (middle_name !== undefined) updateData.middle_name = middle_name || null
    if (suffix !== undefined) updateData.suffix = suffix || null
    if (employee_number !== undefined) updateData.employee_number = employee_number
    if (department !== undefined) updateData.department = department || null
    if (specialization !== undefined) updateData.specialization = specialization || null
    if (email !== undefined) updateData.email = email
    if (phone_number !== undefined) updateData.phone_number = phone_number || null
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (date_hired !== undefined) updateData.date_hired = date_hired || null
    if (address !== undefined) updateData.address = address || null
    if (gender !== undefined) updateData.gender = normalizeGender(gender)
    if (rfid !== undefined) updateData.rfid = rfid || null

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('role', 'teacher')

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    // Update auth email if changed
    if (email !== undefined) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(id, { email })
      } catch (authError) {
        console.error('Failed to update auth email:', authError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    if (body.restore === true) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_archived: false, status: 'Active' } as any)
        .eq('id', id)
        .eq('role', 'teacher')
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, message: 'Teacher restored successfully' })
    }

    return NextResponse.json({ success: false, error: 'Unknown patch operation' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null
    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_archived: true, status: reason || 'Archived' } as any)
      .eq('id', id)
      .eq('role', 'teacher')

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Teacher archived successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
