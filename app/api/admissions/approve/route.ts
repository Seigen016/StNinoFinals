import { Database } from '@/database.types';
import { EmailService } from '@/lib/services/email-service';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

type Admission = Database['public']['Tables']['admissions']['Row'];

// POST - Approve or Reject an admission
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { admissionId, action } = body; // action: 'approve' or 'reject'

    if (!admissionId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing admissionId or action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Fetch the admission record
    const { data: admission, error: fetchError } = await supabase
      .from('admissions')
      .select('*')
      .eq('id', admissionId)
      .single();

    if (fetchError || !admission) {
      return NextResponse.json(
        { success: false, error: 'Admission not found' },
        { status: 404 }
      );
    }

    if (action === 'reject') {
      const rejectionReason = body.rejection_reason || '';
      const wasApproved = admission.status === 'approved';

      const { error: updateError } = await supabase
        .from('admissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', admissionId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // If previously approved, deactivate the student account
      if (wasApproved) {
        try {
          // Find the user by email
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', admission.email_address)
            .eq('role', 'student')
            .single();

          if (existingUser) {
            // Deactivate in users table
            await supabase
              .from('users')
              .update({ status: 'inactive' })
              .eq('id', existingUser.id);

            // Ban from Supabase Auth (prevents login)
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              ban_duration: '876600h', // ~100 years
            });

            console.log('Deactivated previously approved student:', existingUser.id);
          }
        } catch (deactivateError) {
          console.error('Error deactivating student account:', deactivateError);
          // Don't fail the rejection if deactivation fails
        }
      }

      // Send rejection email
      try {
        await EmailService.sendAdmissionRejection({
          parentName: admission.parent_name,
          studentFirstName: admission.first_name,
          studentLastName: admission.last_name,
          email: admission.email_address,
          reason: rejectionReason,
        });
      } catch (emailError) {
        console.error('Rejection email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: wasApproved
          ? 'Admission rejected and student account deactivated'
          : 'Admission rejected successfully',
      });
    }

    // APPROVAL PROCESS
    if (action === 'approve') {
      const tempPassword = `SN${Math.random().toString(36).slice(-6)}`;
      const wasRejected = admission.status === 'rejected';

      // Check if student account already exists (from a previous approval)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', admission.email_address)
        .eq('role', 'student')
        .single();

      let userId: string;

      if (existingUser) {
        // Reactivate existing account
        userId = existingUser.id;

        // Reactivate in users table
        await supabase
          .from('users')
          .update({
            status: 'active',
            password_change_required: true,
          })
          .eq('id', userId);

        // Unban and reset password in Supabase Auth
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
          ban_duration: 'none',
        });

        console.log('Reactivated existing student account:', userId);
      } else {
        // Create new user in Supabase Auth
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: admission.email_address,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: admission.first_name,
              last_name: admission.last_name,
              role: 'student',
            },
          });

        if (authError) {
          console.error('Auth creation error:', authError);
          return NextResponse.json(
            {
              success: false,
              error: `Failed to create auth user: ${authError.message}`,
            },
            { status: 500 }
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { success: false, error: 'Failed to create auth user' },
            { status: 500 }
          );
        }

        userId = authData.user.id;

        // Create user record in users table
        const { error: userError } = await supabase.from('users').insert({
          id: userId,
          email: admission.email_address,
          first_name: admission.first_name,
          last_name: admission.last_name,
          middle_name: admission.middle_name || null,
          date_of_birth: admission.date_of_birth || null,
          guardian_phone: admission.guardian_phone || admission.phone_number,
          guardian_name: admission.parent_name || null,
          guardian_email: admission.parent_email || null,
          suffix: admission.suffix || null,
          lrn: (admission as any).lrn || null,
          // The student number IS the LRN (older admissions may have none)
          student_number: (admission as any).lrn || null,
          // New applications carry both addresses; older ones a single typed address
          ...(admission.permanent_street
            ? {
                address: admission.address,
                current_address: admission.current_address,
                street_details: admission.permanent_street,
                barangay_name: admission.permanent_barangay,
                city: admission.permanent_city,
                province: admission.permanent_province,
              }
            : {
                address: admission.address_type !== 'current' ? admission.address || null : null,
                current_address: admission.address_type === 'current' ? admission.address || null : null,
              }),
          role: 'student',
          grade_level: admission.intended_grade_level,
          created_at: new Date().toISOString(),
          password_change_required: true,
        });

        if (userError) {
          console.error('User creation error:', userError);
          // Rollback: Delete auth user if user record creation fails
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return NextResponse.json(
            {
              success: false,
              error: `Failed to create user record: ${userError.message}`,
            },
            { status: 500 }
          );
        }
      }

      // Update admission status to approved
      const { error: updateError } = await supabase
        .from('admissions')
        .update({ status: 'approved' })
        .eq('id', admissionId);

      if (updateError) {
        console.error('Status update error:', updateError);
      }

      // Send approval email with credentials
      try {
        await EmailService.sendAdmissionApproval({
          parentName: admission.parent_name,
          studentFirstName: admission.first_name,
          studentLastName: admission.last_name,
          email: admission.email_address,
          password: tempPassword,
          gradeLevel: admission.intended_grade_level,
          loginUrl: `${request.headers.get('origin')}/login?email=${encodeURIComponent(admission.email_address)}&password=${encodeURIComponent(tempPassword)}`,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: existingUser
          ? 'Admission approved and student account reactivated'
          : 'Admission approved and student account created successfully',
        data: {
          userId,
          email: admission.email_address,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Approval/Rejection error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
