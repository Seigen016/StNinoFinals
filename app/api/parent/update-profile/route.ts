import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parentId, first_name, last_name, middle_name, suffix, phone_number, address, photo_url } = body;

    if (!parentId) {
      return NextResponse.json({ success: false, error: 'Parent ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const updateData: Record<string, any> = {};

    if (first_name   !== undefined) updateData.first_name   = first_name;
    if (last_name    !== undefined) updateData.last_name    = last_name;
    if (middle_name  !== undefined) updateData.middle_name  = middle_name || null;
    if (suffix       !== undefined) updateData.suffix       = suffix || null;
    if (phone_number !== undefined) updateData.phone_number = phone_number || null;
    if (address      !== undefined) updateData.address      = address || null;
    if (photo_url    !== undefined) updateData.photo_url    = photo_url || null;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', parentId)
      .eq('role', 'parent')
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, parent: data, message: 'Profile updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
