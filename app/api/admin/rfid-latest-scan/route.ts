import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

// GET — poll the rfid_scan_queue for the latest unassigned card tap
// Used by the admin UI Scan button when assigning RFID to a student/teacher
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const windowSec = parseInt(searchParams.get('window') || '15', 10);
    const since = new Date(Date.now() - windowSec * 1000).toISOString();

    const admin = getSupabaseAdmin();
    const { data, error } = await (admin as any)
      .from('rfid_scan_queue')
      .select('rfid_tag, scanned_at')
      .gte('scanned_at', since)
      .neq('rfid_tag', '__ASSIGNMENT_MODE__')
      .order('scanned_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, rfid: null }, { headers: CORS });
    }

    return NextResponse.json({ success: true, rfid: data.rfid_tag, scan_time: data.scanned_at }, { headers: CORS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: CORS });
  }
}
