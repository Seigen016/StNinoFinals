import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parent_id = searchParams.get('parent_id')

    if (!parent_id) {
      return NextResponse.json(
        { success: false, error: 'Parent ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch children through user_relationships table
    const { data: relationships, error } = await supabaseAdmin
      .from('user_relationships')
      .select(`
        related_user_id,
        users!user_relationships_related_user_id_fkey(
          id,
          first_name,
          last_name,
          student_number,
          grade_level,
          section,
          email
        )
      `)
      .eq('user_id', parent_id)

    if (error) {
      console.error('Error fetching children:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Transform the data to get clean children array
    const children = relationships
      ?.map((rel: any) => {
        const user = rel.users
        if (!user) return null
        
        return {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          student_id: user.student_number,
          grade_level: user.grade_level,
          section: user.section,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        }
      })
      .filter(Boolean) || []

    return NextResponse.json({
      success: true,
      children,
    })
  } catch (error: any) {
    console.error('Fetch children error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
