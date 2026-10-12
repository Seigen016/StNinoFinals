import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const role = request.nextUrl.searchParams.get('role');

    let query = admin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('published_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Filter by target audience
    if (role) {
      query = query.or(`target_audience.eq.all,target_audience.eq.${role}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Announcements fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter out expired announcements
    const now = new Date();
    const active = (data || []).filter(
      (a) => !a.expires_at || new Date(a.expires_at) > now
    );

    return NextResponse.json({ success: true, data: active });
  } catch (error: any) {
    console.error('Announcements fetch unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
