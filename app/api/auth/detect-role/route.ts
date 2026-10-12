import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ role: null });
    }

    const emailLower = email.toLowerCase().trim();
    const admin = getSupabaseAdmin();

    // Check users table first (covers student, parent, admin roles)
    const { data: user } = await admin
      .from('users')
      .select('role')
      .ilike('email', emailLower)
      .maybeSingle();

    if (user?.role) {
      return NextResponse.json({ role: user.role });
    }

    // Check teachers table (teachers use a separate table with custom auth)
    const { data: teachers } = await admin
      .from('teachers')
      .select('email')
      .ilike('email', emailLower)
      .limit(1);

    if (teachers && teachers.length > 0) {
      return NextResponse.json({ role: 'teacher' });
    }

    return NextResponse.json({ role: null });
  } catch (e) {
    console.error('detect-role error:', e);
    return NextResponse.json({ role: null });
  }
}
