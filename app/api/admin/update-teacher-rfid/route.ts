import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teacherName, rfidCard } = body

    if (!teacherName || !rfidCard) {
      return NextResponse.json(
        { success: false, error: 'Teacher name and RFID card are required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Fetch all teachers
    const { data: allTeachers, error: fetchError } = await admin
      .from('users')
      .eq('role', 'teacher')
      .select('*')
      .limit(1000)

    if (fetchError) {
      console.error('Error fetching teachers:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 200 }
      )
    }

    // Search for teacher by name (case-insensitive, partial match)
    const searchName = teacherName.toLowerCase().trim()
    const matchedTeachers = (allTeachers || []).filter((teacher: any) => {
      const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim().toLowerCase()
      const name = (teacher.name || '').toLowerCase()
      const email = (teacher.email || '').toLowerCase()
      
      return fullName.includes(searchName) || 
             name.includes(searchName) || 
             email.includes(searchName)
    })

    if (!matchedTeachers || matchedTeachers.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No teacher found with name containing "${teacherName}"`,
          searchedName: teacherName,
          availableTeachers: (allTeachers || []).slice(0, 10).map((t: any) => ({
            name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.name || 'Unknown',
            email: t.email || 'N/A',
            id: t.id || t.teacher_id || 'N/A'
          }))
        },
        { status: 200 }
      )
    }

    // Use first match
    const teacher = matchedTeachers[0]
    const teacherNameDisplay = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name || 'Unknown'

    console.log(`Found teacher: ${teacherNameDisplay}`)
    console.log(`Teacher ID: ${teacher.id || teacher.teacher_id}`)
    console.log(`Assigning RFID: ${rfidCard}`)

    // Update teacher with RFID card number
    const rfidValue = rfidCard.toUpperCase().trim()
    const updateFields: any = {
      rfid: rfidValue,
    }
    
    console.log(`Attempting to update teacher ${teacher.id} with RFID: ${rfidValue}`)
    console.log(`Update fields:`, updateFields)

    const { data: updatedTeacher, error: updateError } = await admin
      .from('users')
      .update(updateFields)
      .eq('id', teacher.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error updating RFID:', updateError)
      console.error('Error code:', updateError.code)
      console.error('Error message:', updateError.message)
      console.error('Error details:', updateError.details)
      console.error('Error hint:', updateError.hint)
      
      // Check if error is about missing column
      const errorMsg = (updateError.message || '').toLowerCase()
      const isColumnError = errorMsg.includes('column') && 
                           (errorMsg.includes('does not exist') || 
                            errorMsg.includes('not found') ||
                            errorMsg.includes('rfid_card'))
      
      if (isColumnError) {
        return NextResponse.json(
          { 
            success: false, 
            error: `RFID column 'rfid_card' not found in teachers table.`,
            hint: 'Run this SQL in Supabase: ALTER TABLE teachers ADD COLUMN rfid_card TEXT;',
            teacherFound: true,
            teacherName: teacherNameDisplay,
            teacherId: teacher.id || teacher.teacher_id,
            actualError: updateError.message,
            errorCode: updateError.code,
          },
          { status: 200 }
        )
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to update RFID: ${updateError.message}`,
          teacherFound: true,
          teacherName: teacherNameDisplay,
          errorCode: updateError.code,
          errorDetails: updateError.details,
          errorHint: updateError.hint,
        },
        { status: 200 }
      )
    }

    // Remove password from response
    const teacherWithoutPassword = { ...updatedTeacher }
    if (teacherWithoutPassword.Password !== undefined) {
      delete teacherWithoutPassword.Password
    }
    if (teacherWithoutPassword.password !== undefined) {
      delete teacherWithoutPassword.password
    }

    return NextResponse.json({
      success: true,
      teacher: teacherWithoutPassword,
      message: `RFID card ${rfidCard} assigned to ${teacherNameDisplay} successfully`,
      teacherName: teacherNameDisplay,
      rfidCard: rfidCard.toUpperCase().trim(),
    }, { status: 200 })
  } catch (error: any) {
    console.error('Update teacher RFID API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 200 }
    )
  }
}

