import { getActivePeriod } from '@/lib/academic-period';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing studentId parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('subject');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      grades: data || [],
    });
  } catch (error: any) {
    console.error('Grades API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if grading period is open before accepting any submission
    const activePeriod = await getActivePeriod();
    if (!activePeriod || activePeriod.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'No quarter is currently active. Grade submission is paused until the next quarter begins.' },
        { status: 423 }
      );
    }
    if (!activePeriod.isGradingOpen) {
      return NextResponse.json(
        { success: false, error: 'Grading period is currently locked. Contact your administrator.' },
        { status: 423 }
      );
    }

    const admin = getSupabaseAdmin();
    const { studentId, subject, grade, teacherId, classId } =
      await request.json();

    if (!studentId || !subject || grade === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Grades are whole numbers from 0 to 100
    const numericGrade = Number(grade);
    if (grade === null || grade === '' || !Number.isInteger(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return NextResponse.json(
        { success: false, error: 'Grade must be a whole number from 0 to 100' },
        { status: 400 }
      );
    }

    const quarter = activePeriod.quarter;

    // One grade per student/subject/class per quarter
    let query = admin
      .from('grades')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('quarter', quarter);

    if (classId) query = query.eq('class_id', classId);

    const { data: existingGrade, error: selectError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing grade:', selectError);
      return NextResponse.json(
        { success: false, error: selectError.message },
        { status: 500 }
      );
    }

    if (existingGrade?.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'This grade is already approved and can no longer be changed.' },
        { status: 409 }
      );
    }

    let result;
    if (existingGrade) {
      // Update existing grade
      const { data, error } = await admin
        .from('grades')
        .update({
          grade: numericGrade,
          teacher_id: teacherId ?? null,
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGrade.id)
        .select();

      if (error) {
        console.error('Error updating grade:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;

      // Record the resubmission so review history shows what the teacher changed
      const { error: historyError } = await admin.from('grade_history').insert({
        grade_id: existingGrade.id,
        student_id: studentId,
        subject,
        quarter,
        grade_value: numericGrade,
        status: 'pending',
      });
      if (historyError) console.error('Failed to record grade history:', historyError);
    } else {
      // Insert new grade
      const { data, error } = await admin
        .from('grades')
        .insert({
          student_id: studentId,
          subject: subject,
          grade: numericGrade,
          teacher_id: teacherId ?? null,
          class_id: classId ?? null,
          quarter,
          status: 'pending',
        })
        .select();

      if (error) {
        console.error('Error inserting grade:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Grade submitted for approval',
    });
  } catch (error: any) {
    console.error('Grades API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
