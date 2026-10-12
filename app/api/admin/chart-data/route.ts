import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // --- Weekly attendance trend: always the trailing 7 calendar days. ---
    // Not driven by the dashboard's date-range picker (that picker scopes the
    // "Attendance Rate" stat card instead) so this widget stays a real weekly
    // trend instead of collapsing to a single bar when a 1-day range is picked.
    const chartDays: { label: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartDays.push({
        label: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        date: d.toISOString().split('T')[0],
      });
    }

    const { count: totalStudents } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    const weeklyAttendance = await Promise.all(
      chartDays.map(async ({ label, date }) => {
        const { data } = await supabaseAdmin
          .from('attendance_records')
          .select('user_id')
          .gte('scan_datetime', `${date}T00:00:00`)
          .lte('scan_datetime', `${date}T23:59:59`);

        const unique = new Set((data ?? []).map((r: any) => r.user_id)).size;
        return {
          day: label,
          present: unique,
          absent: Math.max(0, (totalStudents ?? 0) - unique),
        };
      })
    );

    // --- Grade Approvals breakdown ---
    // Not date-filtered: this reflects the current approval queue (matches the
    // sidebar's pending-count badge), not grades submitted in the selected range.
    const { data: gradeRows } = await supabaseAdmin.from('grades').select('status');

    const gradeCounts = { pending: 0, approved: 0, rejected: 0 };
    for (const row of gradeRows ?? []) {
      const s = row.status as keyof typeof gradeCounts;
      if (s in gradeCounts) gradeCounts[s]++;
    }

    const gradeApprovals = [
      { name: 'Pending', value: gradeCounts.pending, fill: '#f59e0b' },
      { name: 'Approved', value: gradeCounts.approved, fill: '#22c55e' },
      { name: 'Rejected', value: gradeCounts.rejected, fill: '#ef4444' },
    ];

    return NextResponse.json({
      success: true,
      data: { weeklyAttendance, gradeApprovals },
    });
  } catch (error: any) {
    console.error('chart-data error:', error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
