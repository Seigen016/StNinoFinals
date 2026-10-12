import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const STRIKE_WINDOW_MS = 5 * 60 * 1000; // 5-minute window for three-strike counting

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

// POST — called by ESP32/hardware scanner when a card is tapped
// Body: { rfid: string, device_id?: string }
// Returns student info for hardware display + scan result
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rfid, device_id } = body;

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'rfid is required' }, { status: 400, headers: CORS });
    }

    const admin = getSupabaseAdmin();
    const rfidNorm = String(rfid).trim().toUpperCase();

    // Look up user by RFID — match both normalized and original value
    const { data: matchedUsers } = await (admin as any)
      .from('users')
      .select('id, first_name, last_name, student_number, employee_number, grade_level, section, photo_url, role, rfid')
      .in('role', ['student', 'teacher'])
      .not('rfid', 'is', null)
      .limit(200);

    const user = ((matchedUsers as any[]) ?? []).find((u: any) => {
      const stored = String(u.rfid ?? '').trim().toUpperCase();
      return stored === rfidNorm || stored.replace(/^0+/, '') === rfidNorm.replace(/^0+/, '');
    }) ?? null;

    if (!user) {
      const now = new Date().toISOString();

      // Check if admin has assignment mode active — if so, queue this tag for pickup
      const assignmentSince = new Date(Date.now() - 60 * 1000).toISOString();
      let assignmentModeActive = false;
      try {
        const { data: modeRow } = await (admin as any)
          .from('rfid_scan_queue')
          .select('id')
          .eq('rfid_tag', '__ASSIGNMENT_MODE__')
          .gte('scanned_at', assignmentSince)
          .limit(1)
          .single();
        assignmentModeActive = !!modeRow;
      } catch (_) {}

      if (assignmentModeActive) {
        try {
          await (admin as any).from('rfid_scan_queue').insert({
            rfid_tag: rfidNorm,
            scanned_at: now,
          });
        } catch (_) {}
        return NextResponse.json({
          success: true,
          message: 'RFID queued for assignment',
          assignment_mode: true,
          rfid: rfidNorm,
        }, { headers: CORS });
      }

      const windowStart = new Date(Date.now() - STRIKE_WINDOW_MS).toISOString();
      const securityTable = (admin as any).from('security_events');

      await securityTable.insert({
        event_type: 'unauthorized_scan',
        rfid_tag: rfidNorm,
        device_id: device_id ?? null,
        occurred_at: now,
        metadata: {},
      });

      const { count } = await (admin as any)
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'unauthorized_scan')
        .eq('rfid_tag', rfidNorm)
        .gte('occurred_at', windowStart);

      const strikes = (count as number) ?? 1;

      if (strikes >= 3) {
        // Insert the three-strike alert row — Realtime on security_events will notify the admin UI
        await (admin as any).from('security_events').insert({
          event_type: 'three_strike_alert',
          rfid_tag: rfidNorm,
          device_id: device_id ?? null,
          occurred_at: now,
          metadata: { strike_count: strikes },
        });
      }

      return NextResponse.json({
        success: false,
        error: 'unknown_tag',
        message: `RFID ${rfidNorm} is not registered`,
        strikes,
        three_strike_alert: strikes >= 3,
      }, { status: 404, headers: CORS });
    }

    // Determine time-in vs time-out based on today's existing records
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayRecords } = await (admin as any)
      .from('attendance_records')
      .select('id, scan_type, time_in, scan_time')
      .eq('user_id', user.id)
      .gte('scan_time', todayStart.toISOString())
      .order('scan_time', { ascending: true });

    const hasTimeIn = (todayRecords ?? []).some(
      (r: any) => r.scan_type === 'timein' || r.scan_type === 'time_in'
    );
    const hasTimeOut = (todayRecords ?? []).some(
      (r: any) => r.scan_type === 'timeout' || r.scan_type === 'time_out'
    );

    if (hasTimeIn && hasTimeOut) {
      return NextResponse.json({
        success: false,
        error: 'already_complete',
        message: 'Attendance already complete for today',
        student: {
          name: `${user.first_name} ${user.last_name}`,
          gradeLevel: user.grade_level ?? null,
          section: user.section ?? null,
        },
      }, { headers: CORS });
    }

    const now = new Date().toISOString();
    const scanType: 'timein' | 'timeout' = hasTimeIn ? 'timeout' : 'timein';

    const lastTimeIn = (todayRecords ?? [])
      .filter((r: any) => r.scan_type === 'timein' || r.scan_type === 'time_in')
      .at(-1);

    const record: any = {
      user_id: user.id,
      rfid_card: rfidNorm,
      rfid_tag: rfidNorm,
      scan_time: now,
      scan_type: scanType,
      time_in: scanType === 'timein' ? now : (lastTimeIn?.time_in ?? lastTimeIn?.scan_time ?? null),
      time_out: scanType === 'timeout' ? now : null,
      status: 'Present',
      source: 'rfid_hardware',
    };
    if (device_id) record.device_id = device_id;

    const { data: inserted, error: insertError } = await (admin as any)
      .from('attendance_records')
      .insert(record)
      .select('id, scan_time')
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500, headers: CORS });
    }

    return NextResponse.json({
      success: true,
      scanType,
      record: {
        id: inserted.id,
        scanTime: inserted.scan_time,
      },
      student: {
        id: user.student_number ?? user.employee_number ?? user.id,
        name: `${user.first_name} ${user.last_name}`,
        gradeLevel: user.grade_level ?? null,
        section: user.section ?? null,
        photo: user.photo_url ?? null,
        role: user.role,
      },
    }, { headers: CORS });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500, headers: CORS });
  }
}
