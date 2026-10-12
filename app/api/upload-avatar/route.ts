import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const role = (formData.get('role') as string | null) ?? 'student';

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `avatars/${role}-${userId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const admin = getSupabaseAdmin();
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage.from('documents').getPublicUrl(path);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
