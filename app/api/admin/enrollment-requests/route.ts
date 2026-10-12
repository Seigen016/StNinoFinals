import { friendlyError } from '@/lib/error-message';
import { EmailService } from '@/lib/services/email-service';
import { normalizeSchoolYear } from '@/lib/school-year';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('enrollment_requests')
    .select(
      `*, student:users!enrollment_requests_student_id_fkey(id, first_name, last_name, email)`
    )
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status as 'pending' | 'approved' | 'rejected');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Enrollment requests fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: friendlyError(
          error,
          'We could not load the enrollment requests. Please refresh the page and try again.'
        ),
      },
      { status: 500 }
    );
  }
  const normalized = (data || []).map((r: any) => ({ ...r, school_year: normalizeSchoolYear(r.school_year) }));
  return NextResponse.json({ success: true, data: normalized });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    // sectionId (new): assign by formal section — enrolls student in ALL section classes
    // classId (legacy): assign by specific class — still supported for backward compat
    // entryQuarter: for transferees/returnees — which quarter they are starting from
    const { requestId, status, sectionId, classId, entryQuarter, adminNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: 'Please choose a request and a decision before continuing.' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'The decision must be either approve or reject.' },
        { status: 400 }
      );
    }

    if (status === 'approved' && !sectionId && !classId) {
      return NextResponse.json(
        { success: false, error: 'Please select a section to assign before approving this request.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch the request with student info
    const { data: enrollmentRequest, error: fetchError } = await supabase
      .from('enrollment_requests')
      .select(
        'id, student_id, grade_level, school_year, assigned_class_id, student:users!enrollment_requests_student_id_fkey(first_name, last_name, email)'
      )
      .eq('id', requestId)
      .single();

    if (fetchError || !enrollmentRequest) {
      return NextResponse.json(
        { success: false, error: 'That enrollment request no longer exists. Please refresh the list.' },
        { status: 404 }
      );
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      status,
      admin_notes: adminNotes ?? null,
      updated_at: new Date().toISOString(),
    };
    if (sectionId)    updatePayload.assigned_section_id = sectionId;
    if (classId)      updatePayload.assigned_class_id   = classId;
    if (entryQuarter) updatePayload.entry_quarter        = Number(entryQuarter);

    const { error: updateError } = await supabase
      .from('enrollment_requests')
      .update(updatePayload)
      .eq('id', requestId);

    if (updateError) {
      console.error('Enrollment request update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: friendlyError(
            updateError,
            'We could not save this decision. Please try again in a moment.'
          ),
        },
        { status: 500 }
      );
    }

    if (status === 'approved') {
      let classIdsToEnroll: string[] = [];
      let sectionName: string | null = null;
      let gradeForUpdate: string | null = null;

      if (sectionId) {
        // ── Section-based path (Phase 3+) ────────────────────────────────────
        const { data: section, error: sectionError } = await supabase
          .from('sections')
          .select('id, name, grade_level, school_year')
          .eq('id', sectionId)
          .single();

        if (sectionError || !section) {
          return NextResponse.json(
            { success: false, error: 'That section no longer exists. Please pick another section.' },
            { status: 404 }
          );
        }

        sectionName   = section.name;
        gradeForUpdate = section.grade_level;

        // Find all classes belonging to this section (by section_id FK first)
        // Select semester too so we can filter by entry_quarter if needed
        let { data: sectionClasses } = await supabase
          .from('classes')
          .select('id, semester')
          .eq('section_id', sectionId);

        // Fallback: match by section text + grade + year if FK link not yet populated
        if (!sectionClasses || sectionClasses.length === 0) {
          const { data: textClasses } = await supabase
            .from('classes')
            .select('id, semester')
            .eq('section', section.name)
            .eq('grade_level', section.grade_level)
            .eq('school_year', section.school_year);
          sectionClasses = textClasses ?? [];
        }

        // For transferees/returnees entering mid-year, only enroll from entry_quarter
        const eq = entryQuarter ? Number(entryQuarter) : null;
        if (eq && eq > 1 && sectionClasses) {
          sectionClasses = sectionClasses.filter((c) => {
            const q = parseInt(String((c as any).semester ?? ''));
            // Keep class if quarter can't be determined OR it's >= entry quarter
            return isNaN(q) || q >= eq;
          });
        }

        classIdsToEnroll = (sectionClasses || []).map((c) => c.id);
      } else if (classId) {
        // ── Legacy class-based path ───────────────────────────────────────────
        const { data: assignedClass } = await supabase
          .from('classes')
          .select('section, grade_level, school_year')
          .eq('id', classId)
          .single();

        sectionName   = assignedClass?.section ?? null;
        gradeForUpdate = assignedClass?.grade_level ?? null;
        classIdsToEnroll = [classId];

        if (assignedClass?.section && assignedClass?.grade_level && assignedClass?.school_year) {
          const { data: siblingClasses } = await supabase
            .from('classes')
            .select('id')
            .eq('section', assignedClass.section)
            .eq('grade_level', assignedClass.grade_level)
            .eq('school_year', assignedClass.school_year);

          if (siblingClasses && siblingClasses.length > 0) {
            classIdsToEnroll = [...new Set([classId, ...siblingClasses.map((c) => c.id)])];
          }
        }
      }

      if (classIdsToEnroll.length > 0) {
        const { error: classError } = await supabase.from('user_classes').upsert(
          classIdsToEnroll.map((cid) => ({
            user_id: enrollmentRequest.student_id,
            class_id: cid,
            membership_type: 'student',
          })),
          { onConflict: 'user_id,class_id', ignoreDuplicates: true }
        );

        if (classError) {
          console.error('Class enrollment error:', classError);
          return NextResponse.json(
            {
              success: false,
              error:
                'The request was approved, but the student could not be added to the section’s subjects. Please add them manually or try approving again.',
            },
            { status: 500 }
          );
        }
      }

      // Update student's grade_level and section
      if (gradeForUpdate) {
        await supabase
          .from('users')
          .update({ grade_level: gradeForUpdate, section: sectionName })
          .eq('id', enrollmentRequest.student_id);

        // Grade 7+ → sever parent-student relationship (student is JHS/SHS age)
        const gradeNum = parseInt(String(gradeForUpdate).replace(/\D/g, ''), 10);
        if (!isNaN(gradeNum) && gradeNum >= 7) {
          await supabase
            .from('user_relationships')
            .delete()
            .eq('related_user_id', enrollmentRequest.student_id);
        }
      }
    } else if (status === 'rejected') {
      // Remove student from ALL classes they were enrolled in through this request.
      // On approval the student was added to all sibling classes in the section,
      // so we remove all user_classes rows for this student (not just assigned_class_id).
      if (enrollmentRequest.student_id) {
        await supabase
          .from('user_classes')
          .delete()
          .eq('user_id', enrollmentRequest.student_id);
      }

      // Clear the assigned class reference on the request itself
      await supabase
        .from('enrollment_requests')
        .update({ assigned_class_id: null })
        .eq('id', requestId);
    }

    // Send email notification on any rejection
    if (status === 'rejected') {
      try {
        // Prefer the relation-joined student; fall back to a direct user fetch in
        // case the FK alias didn't resolve (e.g. FK name mismatch in live DB).
        let studentEmail: string | null = null;
        let studentName = 'Student';

        const relationStudent = Array.isArray(enrollmentRequest.student)
          ? enrollmentRequest.student[0]
          : enrollmentRequest.student;

        if (relationStudent?.email) {
          studentEmail = relationStudent.email;
          studentName = `${relationStudent.first_name} ${relationStudent.last_name}`;
        } else if (enrollmentRequest.student_id) {
          const { data: fallbackUser } = await supabase
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', enrollmentRequest.student_id)
            .single();
          if (fallbackUser?.email) {
            studentEmail = fallbackUser.email;
            studentName = `${fallbackUser.first_name} ${fallbackUser.last_name}`;
          }
        }

        if (studentEmail) {
          await EmailService.sendEnrollmentRejection({
            to: studentEmail,
            studentName,
            gradeLevel: enrollmentRequest.grade_level,
            schoolYear: enrollmentRequest.school_year,
            adminNotes: adminNotes ?? null,
          });
        }
      } catch (emailError) {
        console.error('Failed to send enrollment rejection email:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Enrollment request PATCH error:', e);
    return NextResponse.json(
      {
        success: false,
        error: friendlyError(
          e,
          'We could not save this decision. Please try again in a moment.'
        ),
      },
      { status: 500 }
    );
  }
}
