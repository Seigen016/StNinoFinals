import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('rooms')
      .select('*')
      .order('name');
    if (error) throw error;
    return NextResponse.json({ success: true, rooms: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { name, capacity, description } = body;
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const { data, error } = await admin
      .from('rooms')
      .insert({ name: name.trim(), capacity: capacity || null, description: description?.trim() || null })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, room: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { id, name, capacity, description, is_active } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (capacity !== undefined) updates.capacity = capacity || null;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await admin
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, room: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const { error } = await admin.from('rooms').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
