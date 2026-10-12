import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Announcements GET error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Announcements GET unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = getSupabaseAdmin();
    const body = await request.json();
    const { title, content, priority, target_audience, is_active, published_at, expires_at, author_id } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        priority: priority || 'medium',
        target_audience: target_audience || 'all',
        is_active: is_active ?? true,
        published_at: published_at || new Date().toISOString(),
        expires_at: expires_at || null,
        author_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Announcements POST error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Announcements POST unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = getSupabaseAdmin();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing announcement id' },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from('announcements')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Announcements PATCH error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Announcements PATCH unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = getSupabaseAdmin();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing announcement id' },
        { status: 400 }
      );
    }

    const { error } = await admin.from('announcements').delete().eq('id', id);

    if (error) {
      console.error('Announcements DELETE error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Announcements DELETE unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
