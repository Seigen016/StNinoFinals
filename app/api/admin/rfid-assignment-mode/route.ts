import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// POST — called when admin clicks the Scan button in the student form
// Inserts a sentinel row so attendance-live knows assignment mode is active
export async function POST() {
  try {
    const admin = getSupabaseAdmin();
    await (admin as any).from('rfid_scan_queue').insert({
      rfid_tag: '__ASSIGNMENT_MODE__',
      scanned_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE — called when the scan is stopped (dialog closed, scan cancelled, or card captured)
// Removes the sentinel so attendance-live stops treating unknown cards as "Registered"
export async function DELETE() {
  try {
    const admin = getSupabaseAdmin();
    await (admin as any)
      .from('rfid_scan_queue')
      .delete()
      .eq('rfid_tag', '__ASSIGNMENT_MODE__');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
