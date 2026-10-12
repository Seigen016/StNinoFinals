import { EmailService } from '@/lib/services/email-service';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('archived') === 'true';
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all parents
    const { data: parents, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'parent')
      .eq('is_archived', showArchived)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Fetch children relationships for each parent
    const parentsWithChildren = await Promise.all(
      (parents || []).map(async (parent) => {
        const { data: relationships } = await supabaseAdmin
          .from('user_relationships')
          .select(
            `
            id,
            relationship_type,
            related_user_id,
            users!user_relationships_related_user_id_fkey (
              id,
              first_name,
              last_name
            )
          `
          )
          .eq('user_id', parent.id);

        const children =
          relationships?.map((rel: any) => ({
            id: rel.related_user_id,
            name: `${rel.users.first_name} ${rel.users.last_name}`,
            relationship_type: rel.relationship_type || 'child',
          })) || [];

        return {
          ...parent,
          name: `${parent.first_name} ${parent.last_name}`,
          children,
        };
      })
    );

    return NextResponse.json({ success: true, parents: parentsWithChildren });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      middle_name,
      suffix,
      email,
      phone_number,
      address,
      password,
    } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    // Create user record
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      first_name,
      last_name,
      middle_name: middle_name || null,
      suffix: suffix || null,
      email,
      phone_number: phone_number || null,
      address: address || null,
      role: 'parent',
      status: 'active',
      password_change_required: true,
    });

    if (insertError) {
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    // Send welcome email with login credentials
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      await EmailService.sendLoginCredentials({
        name: `${first_name} ${last_name}`,
        email: email,
        password: password,
        role: 'parent',
        loginUrl: loginUrl,
      });
      console.log('Welcome email sent to parent:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Parent added successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
