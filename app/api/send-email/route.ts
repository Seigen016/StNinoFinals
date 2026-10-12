import { EmailService } from '@/lib/services/email-service';
import { after } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json();

    if (!to || !subject || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      );
    }

    // Fire-and-forget: respond immediately, send SMTP in background
    after(
      EmailService.sendComposedEmail(to, subject, text).catch((err) =>
        console.error('[send-email] background send failed:', err)
      )
    );

    return NextResponse.json({ success: true, message: 'Email sent' });
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
