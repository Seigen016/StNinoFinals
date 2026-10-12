import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// POST — manually trigger a three_strike_alert for testing Realtime + dialog
export async function POST() {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await (admin as any).from('security_events').insert({
      event_type: 'three_strike_alert',
      rfid_tag: 'TEST_RFID',
      occurred_at: new Date().toISOString(),
      metadata: { strike_count: 3, test: true },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test alert triggered' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
