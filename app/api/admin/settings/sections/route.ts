import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const SETTING_KEY = 'gradeSections';

// GET - Fetch sections per grade
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', SETTING_KEY)
      .limit(1);

    if (error || !data || data.length === 0 || !data[0]?.setting_value) {
      return NextResponse.json({ success: true, sections: {} });
    }

    try {
      const sections = JSON.parse(data[0].setting_value);
      return NextResponse.json({ success: true, sections });
    } catch {
      return NextResponse.json({ success: true, sections: {} });
    }
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ success: true, sections: {} });
  }
}

// POST - Save sections per grade
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const sections = body.sections || {};
    const value = JSON.stringify(sections);

    // Check if the row already exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', SETTING_KEY)
      .limit(1);

    let error;

    if (existing && existing.length > 0) {
      // Update existing row
      const result = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
      error = result.error;
    } else {
      // Insert new row
      const result = await supabase
        .from('system_settings')
        .insert({
          setting_key: SETTING_KEY,
          setting_value: value,
          updated_at: new Date().toISOString(),
        });
      error = result.error;
    }

    if (error) {
      console.error('Error saving sections:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sections saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving sections:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save sections' },
      { status: 500 }
    );
  }
}
