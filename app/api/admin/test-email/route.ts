import { EmailService } from '@/lib/services/email-service';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/test-email
 * Sends a test email to a given address so admins can verify the SMTP
 * configuration without needing to create a new user.
 *
 * Body: { email: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
      return NextResponse.json(
        {
          success: false,
          error:
            'SMTP_EMAIL or SMTP_PASS is not configured. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    await EmailService.sendTestEmail(email);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: email,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}
