import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

const buildMockStudent = (email: string) => ({
  id: 0,
  email,
  name: 'Development Student',
  grade_level: 'Grade 10',
  section: 'A',
})

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const emailLower = email.toLowerCase().trim()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabaseClient = supabase

    // Check if Supabase is configured
    if (!supabaseClient) {
      console.error('Supabase client not initialized')
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          student: buildMockStudent(emailLower),
          mock: true,
          warning: 'Supabase not configured. Returning mock student in development.',
        })
      }
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database service not configured. Please check your environment variables.' 
        },
        { status: 500 }
      )
    }

    // Query the students table for a matching email (case-insensitive)
    
    const { data: students, error } = await supabaseClient
      .from('students')
      .select('*')
      .limit(10) // Get multiple to check case sensitivity

    if (error) {
      console.error('Database error:', error)
      
      // Provide more specific error messages
      const errorMsg = error.message || String(error) || ''
      if (error.code === '42P01' || (errorMsg && errorMsg.includes('does not exist'))) {
        return NextResponse.json({
          success: false,
          error: 'Students table does not exist in the database. Please create the students table first.',
        }, { status: 500 })
      }
      
      if (error.code === 'PGRST116' || (errorMsg && errorMsg.includes('relation'))) {
        return NextResponse.json({
          success: false,
          error: 'Database connection error. Please check your Supabase configuration.',
        }, { status: 500 })
      }

      // In development, provide more detailed error
      if (process.env.NODE_ENV === 'development') {
        console.warn('Database error (development mode):', errorMsg, error.code)
        return NextResponse.json({
          success: false,
          error: `Database error: ${errorMsg}. Please check if the students table exists and has 'email' and 'Password' columns.`,
        }, { status: 500 })
      }
      
      return NextResponse.json(
        { success: false, error: 'Database connection error. Please try again later.' },
        { status: 500 }
      )
    }

    // Debug: Log all students and their emails (in development only)
    if (process.env.NODE_ENV === 'development' && students) {
      console.log('Found students:', students.length)
      console.log('Looking for email:', emailLower)
      students.forEach((s: any, idx: number) => {
        console.log(`Student ${idx}:`, {
          email: s.email,
          emailLower: s.email?.toLowerCase(),
          hasPassword: s.Password !== undefined || s.password !== undefined,
          passwordField: s.Password !== undefined ? 'Password' : s.password !== undefined ? 'password' : 'none',
          allKeys: Object.keys(s)
        })
      })
    }

    // Find student by email (case-insensitive)
    const student = students?.find((s: any) => 
      s.email && s.email.toLowerCase().trim() === emailLower
    )

    // Check if student exists
    if (!student) {
      console.error('Student not found for email:', email)
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          student: buildMockStudent(emailLower),
          mock: true,
          warning: `Mock student returned because ${email} was not found.`,
        })
      }
      return NextResponse.json(
        { success: false, error: `No student found with email: ${email}. Please check your email address.` },
        { status: 401 }
      )
    }

    // Check if Password field exists (case-sensitive column name)
    // Try both 'password' and 'Password' to handle different naming conventions
    const passwordField = student.Password !== undefined ? 'Password' : 
                          student.password !== undefined ? 'password' : null
    
    if (!passwordField) {
      console.error('Password field not found in student record. Available fields:', Object.keys(student))
      return NextResponse.json(
        { success: false, error: 'Database configuration error: Password field not found in student record.' },
        { status: 500 }
      )
    }

    // Compare passwords
    // Note: In production, passwords should be hashed using bcrypt or similar
    // For now, this assumes plain text comparison. You should hash passwords when storing them.
    const studentPassword = passwordField === 'Password' ? student.Password : student.password
    
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Password comparison:', {
        provided: password,
        stored: studentPassword ? '***' : 'null/undefined',
        match: studentPassword === password,
        fieldName: passwordField
      })
    }
    
    if (!studentPassword || studentPassword !== password) {
      console.error('Password mismatch for email:', email)
      return NextResponse.json(
        { success: false, error: 'Invalid password. Please check your password and try again.' },
        { status: 401 }
      )
    }

    // Remove password from response for security
    const studentWithoutPassword = { ...student }
    if (studentWithoutPassword.Password !== undefined) {
      delete studentWithoutPassword.Password
    }
    if (studentWithoutPassword.password !== undefined) {
      delete studentWithoutPassword.password
    }

    // Check if this is first login
    const firstLogin = student.first_login === true || student.first_login === 1 || student.firstLogin === true

    return NextResponse.json({
      success: true,
      student: studentWithoutPassword,
      firstLogin: firstLogin,
    })
  } catch (error: any) {
    console.error('Student login API error:', error)
    
    // Handle network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Supabase fetch failed in development. Returning mock student.')
        return NextResponse.json({
          success: true,
          student: buildMockStudent('dev@example.com'),
          mock: true,
          warning: 'Supabase fetch failed. Mock student returned.',
        })
      }
      return NextResponse.json(
        { success: false, error: 'Network error. Please check your internet connection.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

