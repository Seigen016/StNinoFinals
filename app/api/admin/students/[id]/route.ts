import { normalizeGender } from '@/lib/gender'
import { findRfidOwner } from '@/lib/rfid';
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
      suffix,
      student_number,
      lrn,
      grade_level,
      section,
      email,
      phone_number,
      guardian_phone,
      date_of_birth,
      gender,
      address,
      current_address,
      barangay,
      barangay_name,
      street_details,
      rfid,
    } = body

    const supabaseAdmin = getSupabaseAdmin()

    // Check student_number uniqueness if it's being changed
    if (student_number !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('student_number', student_number)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Student number is already in use by another student.' },
          { status: 409 }
        )
      }
    }

    // Check RFID uniqueness if it's being changed
    if (rfid) {
      const owner = await findRfidOwner(supabaseAdmin, rfid, id)
      if (owner) {
        return NextResponse.json(
          { success: false, error: `This RFID card is already assigned to ${owner.name} (${owner.role}). Clear that assignment first before reassigning.` },
          { status: 409 }
        )
      }
    }

    // Build update object with only defined values
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (middle_name !== undefined) updateData.middle_name = middle_name || null
    if (suffix !== undefined) updateData.suffix = suffix || null
    if (student_number !== undefined) updateData.student_number = student_number || null
    if (lrn !== undefined) updateData.lrn = lrn || null
    if (grade_level !== undefined) updateData.grade_level = grade_level
    if (section !== undefined) updateData.section = section || null
    if (email !== undefined) updateData.email = email
    if (phone_number !== undefined) updateData.phone_number = phone_number || null
    if (guardian_phone !== undefined) updateData.guardian_phone = guardian_phone || null
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (gender !== undefined) updateData.gender = normalizeGender(gender)
    if (address !== undefined) updateData.address = address || null
    if (current_address !== undefined) updateData.current_address = current_address || null
    if (barangay !== undefined) updateData.barangay = barangay || null
    if (barangay_name !== undefined) updateData.barangay_name = barangay_name || null
    if (street_details !== undefined) updateData.street_details = street_details || null
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
        .eq('role', 'student')
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, message: 'Student restored successfully' })
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
      .eq('role', 'student')

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Student archived successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
