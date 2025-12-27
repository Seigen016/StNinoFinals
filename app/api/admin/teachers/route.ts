import { EmailService } from '@/lib/services/email-service'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

// GET - Fetch all teachers
export async function GET() {
  try {
    const admin = getSupabaseAdmin()

    const { data: teachers, error } = await admin
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teachers:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      teachers: teachers || [],
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new teacher
export async function POST(request: Request) {
  try {
    const admin = getSupabaseAdmin()
    const body = await request.json()

    const {
      first_name,
      last_name,
      middle_name,
      employee_number,
      email,
      phone_number,
      department,
      specialization,
      date_hired,
      date_of_birth,
      address,
      rfid,
      password,
    } = body

    // Validation
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-8),
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: `Authentication error: ${authError.message}` },
        { status: 500 }
      )
    }

    // Store the password to send in email
    const generatedPassword = password || authData.user.email

    // Insert teacher into users table
    const { data: teacher, error: insertError } = await admin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name,
          last_name,
          middle_name: middle_name || null,
          employee_number: employee_number || null,
          phone_number: phone_number || null,
          department: department || null,
          specialization: specialization || null,
          date_hired: date_hired || null,
          date_of_birth: date_of_birth || null,
          address: address || null,
          rfid: rfid || null,
          role: 'teacher',
          status: 'Active',
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // Try to delete the auth user if insert fails
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: `Failed to create teacher: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Send welcome email with login credentials
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/teacher`;
      await EmailService.sendLoginCredentials({
        name: `${first_name} ${last_name}`,
        email: email,
        password: generatedPassword,
        role: 'teacher',
        loginUrl: loginUrl,
      });
      console.log('Welcome email sent to teacher:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      teacher,
      message: 'Teacher created successfully',
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
