import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const emailLower = email.toLowerCase().trim()

    // First, try to find parent/guardian in a parents/guardians table
    // If that doesn't exist, we'll check students table for parent_email field
    let parent = null
    let children: any[] = []

    // Try to find in parents table (if it exists)
    const { data: parents, error: parentsError } = await admin
      .from('parents')
      .select('*')
      .limit(10)

    if (!parentsError && parents) {
      parent = parents.find((p: any) => 
        p.email && p.email.toLowerCase().trim() === emailLower
      )
    }

    // If not found in parents table, check students table for parent_email
    if (!parent) {
      const { data: students, error: studentsError } = await admin
        .from('students')
        .select('*')
        .limit(100)

      if (!studentsError && students) {
        // Find student with matching parent_email
        const studentWithParent = students.find((s: any) => 
          s.parent_email && s.parent_email.toLowerCase().trim() === emailLower
        )

        if (studentWithParent) {
          // Create a parent object from student's parent info
          parent = {
            id: `parent_${studentWithParent.id}`,
            email: studentWithParent.parent_email,
            name: studentWithParent.parent_name || 'Parent/Guardian',
            password: studentWithParent.parent_password || null,
            Password: studentWithParent.parent_password || null,
          }

          // Find all children with this parent_email
          children = students.filter((s: any) => 
            s.parent_email && s.parent_email.toLowerCase().trim() === emailLower
          )
        }
      }
    } else {
      // If parent found in parents table, get their children
      const { data: students, error: studentsError } = await admin
        .from('students')
        .select('*')
        .limit(100)

      if (!studentsError && students) {
        // Find children by parent_id or parent_email
        children = students.filter((s: any) => 
          (s.parent_id && s.parent_id === parent.id) ||
          (s.parent_email && s.parent_email.toLowerCase().trim() === emailLower)
        )
      }
    }

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password
    const parentPassword = parent.Password !== undefined ? parent.Password : 
                           parent.password !== undefined ? parent.password : null

    if (!parentPassword || parentPassword !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return parent data with children (excluding passwords)
    const parentWithoutPassword = { ...parent }
    if (parentWithoutPassword.Password !== undefined) delete parentWithoutPassword.Password
    if (parentWithoutPassword.password !== undefined) delete parentWithoutPassword.password

    // Clean children data (remove passwords)
    const cleanChildren = children.map((child: any) => {
      const cleanChild = { ...child }
      if (cleanChild.Password !== undefined) delete cleanChild.Password
      if (cleanChild.password !== undefined) delete cleanChild.password
      return cleanChild
    })

    return NextResponse.json({
      success: true,
      parent: parentWithoutPassword,
      children: cleanChildren,
      userType: 'parent',
    })
  } catch (error: any) {
    console.error('Parent login error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

