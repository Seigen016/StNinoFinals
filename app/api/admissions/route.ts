import { birthDateError, NAME_FIELDS, nameCaseFields } from '@/lib/person';
import { formatAddress, missingAddressFields, normalizeAddress } from '@/lib/address';
import { Database } from '@/database.types';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

type AdmissionInsert = Database['public']['Tables']['admissions']['Insert'];

// GET - Fetch all admissions with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('admissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('GET Admissions error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new admission
export async function POST(request: Request) {
  try {
    const body = nameCaseFields(await request.json(), NAME_FIELDS);

    // Validate required fields
    if (
      !body.first_name ||
      !body.last_name ||
      !body.email_address ||
      !body.phone_number ||
      !body.date_of_birth
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: first_name, last_name, email_address, phone_number, date_of_birth',
        },
        { status: 400 }
      );
    }

    const dobError = birthDateError(body.date_of_birth);
    if (dobError) {
      return NextResponse.json({ success: false, error: dobError }, { status: 400 });
    }

    // Both addresses are required, every part filled in
    const permanent = normalizeAddress(body.permanent_address);
    const current = normalizeAddress(body.current_address);
    const missingPermanent = missingAddressFields(permanent);
    const missingCurrent = missingAddressFields(current);
    if (missingPermanent.length || missingCurrent.length) {
      const parts = [
        missingPermanent.length ? `Permanent Address (${missingPermanent.join(', ')})` : '',
        missingCurrent.length ? `Current Address (${missingCurrent.join(', ')})` : '',
      ].filter(Boolean);
      return NextResponse.json(
        { success: false, error: `Please complete: ${parts.join('; ')}` },
        { status: 400 }
      );
    }

    // Validate phone: accept +63XXXXXXXXXX (13 chars) or 09XXXXXXXXX (11 digits)
    if (!/^(\+63\d{10}|0\d{10}|\d{10,11})$/.test(body.phone_number)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid phone number, e.g. 09XXXXXXXXX or +63XXXXXXXXXX.',
        },
        { status: 400 }
      );
    }

    if (!/^\d{12}$/.test(body.lrn || '')) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 12-digit LRN (Learner Reference Number).' },
        { status: 400 }
      );
    }

    const { data: lrnOwner } = await supabase
      .from('users')
      .select('id')
      .or(`student_number.eq.${body.lrn},lrn.eq.${body.lrn}`)
      .limit(1)
      .maybeSingle();
    if (lrnOwner) {
      return NextResponse.json(
        { success: false, error: 'This LRN is already registered. Please contact the school.' },
        { status: 409 }
      );
    }

    const ENROLLMENT_TYPES =['new', 'returning', 'transferee', 'returnee', 'repeater'];
    const enrollmentType = ENROLLMENT_TYPES.includes(body.enrollment_type)
      ? body.enrollment_type
      : 'new';

    // Previous school is only meaningful for transferees/returnees
    if (
      (enrollmentType === 'transferee' || enrollmentType === 'returnee') &&
      !body.previous_school
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide the previous school name for a transferee or returnee applicant.',
        },
        { status: 400 }
      );
    }

    // Check for existing admission with same email
    const { data: existingAdmission } = await supabase
      .from('admissions')
      .select('id, status')
      .eq('email_address', body.email_address)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check for existing user account with same email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email_address)
      .limit(1)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please use a different email or contact the school.' },
        { status: 409 }
      );
    }

    if (existingAdmission && (existingAdmission.status === 'approved' || existingAdmission.status === 'rejected')) {
      return NextResponse.json(
        { success: false, error: 'An application with this email has already been processed. Please contact the school for assistance.' },
        { status: 409 }
      );
    }

    const admissionData: AdmissionInsert = {
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body.middle_name || null,
      date_of_birth: body.date_of_birth,
      suffix: body.suffix || null,
      // address keeps the composed permanent address for existing readers
      address: formatAddress(permanent),
      address_type: 'permanent',
      current_address: formatAddress(current),
      permanent_street: permanent.street,
      permanent_barangay: permanent.barangay,
      permanent_city: permanent.city,
      permanent_province: permanent.province,
      current_street: current.street,
      current_barangay: current.barangay,
      current_city: current.city,
      current_province: current.province,
      lrn: body.lrn || null,
      parent_name: body.parent_name,
      parent_email: body.parent_email || null,
      email_address: body.email_address,
      phone_number: body.phone_number,
      guardian_phone: body.guardian_phone || body.phone_number,
      intended_grade_level: body.intended_grade_level,
      previous_school: body.previous_school || null,
      enrollment_type: enrollmentType,
      school_year: body.school_year || null,
      additional_message: body.additional_message || null,
      status: 'pending',
    };

    let data;
    let isUpdate = false;

    // If pending admission exists, update it (re-application)
    if (existingAdmission && existingAdmission.status === 'pending') {
      const { data: updated, error } = await supabase
        .from('admissions')
        .update({
          ...admissionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAdmission.id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      data = updated;
      isUpdate = true;
    } else {
      const { data: inserted, error } = await supabase
        .from('admissions')
        .insert([admissionData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      data = inserted;
    }

    return NextResponse.json({
      success: true,
      data,
      isUpdate,
      message: isUpdate
        ? 'Admission inquiry updated successfully'
        : 'Admission inquiry submitted successfully',
    });
  } catch (error: any) {
    console.error('POST Admissions error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update admission status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing admission ID' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be pending, approved, or rejected',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('admissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Admission status updated successfully',
    });
  } catch (error: any) {
    console.error('PATCH Admissions error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
