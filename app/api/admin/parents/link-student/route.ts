import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      parent_id,
      student_id,
      relationship_type,
      is_primary,
    } = body

    if (!parent_id || !student_id) {
      return NextResponse.json(
        { success: false, error: 'Parent ID and Student ID are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check if relationship already exists
    const { data: existing } = await supabaseAdmin
      .from('user_relationships')
      .select('id')
      .eq('user_id', parent_id)
      .eq('related_user_id', student_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This student is already linked to this parent' },
        { status: 400 }
      )
    }

    // Create relationship
    const { error: insertError } = await supabaseAdmin
      .from('user_relationships')
      .insert({
        user_id: parent_id,
        related_user_id: student_id,
        relationship_type: relationship_type || 'parent',
        is_primary: is_primary || false,
        can_pickup: true,
      })

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Student linked successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
