import { TextBeeService } from '@/services/textbee';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/test-sms
 * Sends a test SMS to a given phone number so admins can verify the
 * TextBee integration without needing an actual RFID scan.
 *
 * Body: { phone: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message: customMessage } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate environment configuration before attempting send
    if (!process.env.TEXTBEE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            'TEXTBEE_API_KEY is not configured. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    if (!process.env.TEXTBEE_DEVICE_ID) {
      return NextResponse.json(
        {
          success: false,
          error:
            'TEXTBEE_DEVICE_ID is not configured. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    const message =
      customMessage?.trim() ||
      `[Sto Niño Portal] This is a test SMS. If you received this, SMS notifications are working correctly. — ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`;

    const messageId = await TextBeeService.sendSms(phone, message);

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      messageId,
      sentTo: phone,
    });
  } catch (error: any) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to send test SMS',
      },
      { status: 500 }
    );
  }
}
