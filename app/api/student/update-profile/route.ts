import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, ...fields } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Map client-side field names to DB column names
    const updateData: Record<string, any> = {};
    if (fields.first_name  !== undefined) updateData.first_name   = fields.first_name;
    if (fields.last_name   !== undefined) updateData.last_name    = fields.last_name;
    if (fields.middle_name !== undefined) updateData.middle_name  = fields.middle_name || null;
    if (fields.suffix      !== undefined) updateData.suffix       = fields.suffix || null;
    if (fields.phone_number !== undefined) updateData.phone_number = fields.phone_number || null;
    if (fields.address     !== undefined) updateData.address      = fields.address || null;
    if (fields.current_address !== undefined) updateData.current_address = fields.current_address || null;
    if (fields.guardian_phone !== undefined) updateData.guardian_phone = fields.guardian_phone || null;
    if (fields.date_of_birth !== undefined) updateData.date_of_birth = fields.date_of_birth || null;
    // profile_picture is the client-side key; the DB column is photo_url
    if (fields.profile_picture !== undefined) updateData.photo_url = fields.profile_picture || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from('users')
      .update(updateData)
      .eq('id', studentId)
      .eq('role', 'student')
      .select()
      .single();

    if (error) {
      console.error('Student update-profile error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Strip password before returning
    const { password: _pw, Password: _PW, ...safeData } = data as any;

    return NextResponse.json({ success: true, student: safeData });
  } catch (error: any) {
    console.error('Student update-profile unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
