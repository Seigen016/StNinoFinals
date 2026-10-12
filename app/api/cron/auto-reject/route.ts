import { EmailService } from '@/lib/services/email-service';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const HOURS_THRESHOLD = 48;

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET so only the scheduler can call this
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const cutoff = new Date(Date.now() - HOURS_THRESHOLD * 60 * 60 * 1000).toISOString();

  const { data: stale, error: fetchError } = await supabase
    .from('enrollment_requests')
    .select('id, grade_level, school_year, assigned_class_id, student_id, student:users!enrollment_requests_student_id_fkey(first_name, last_name, email)')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  if (!stale || stale.length === 0) {
    return NextResponse.json({ success: true, rejected: 0, message: 'No stale requests found.' });
  }

  const ids = stale.map((r: any) => r.id);

  const { error: updateError } = await supabase
    .from('enrollment_requests')
    .update({
      status: 'rejected',
      admin_notes: `Auto-rejected: no action taken within ${HOURS_THRESHOLD} hours.`,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  // Un-enroll from any previously assigned class, then notify students
  await Promise.allSettled(
    stale.map(async (req: any) => {
      if (req.assigned_class_id) {
        await supabase
          .from('user_classes')
          .delete()
          .eq('user_id', req.student_id)
          .eq('class_id', req.assigned_class_id);
      }

      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      if (student?.email) {
        await EmailService.sendEnrollmentAutoReject({
          to: student.email,
          studentName: `${student.first_name} ${student.last_name}`,
          gradeLevel: req.grade_level,
          schoolYear: req.school_year,
          hoursThreshold: HOURS_THRESHOLD,
        }).catch((e: any) => console.error('Email error:', e));
      }
    })
  );

  return NextResponse.json({ success: true, rejected: stale.length });
}
