import { TextBeeService } from '@/services/textbee';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate inputs
    if (!phoneNumber || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing phoneNumber or message in request body',
        },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.TEXTBEE_API_KEY || !process.env.TEXTBEE_DEVICE_ID) {
      return NextResponse.json(
        {
          success: false,
          error: 'TextBee API credentials not configured',
        },
        { status: 500 }
      );
    }

    console.log('📱 Testing SMS send to:', phoneNumber);
    console.log('💬 Message:', message);

    // Send SMS
    const messageId = await TextBeeService.sendSms(phoneNumber, message);

    console.log('✅ SMS sent successfully! Message ID:', messageId);

    return NextResponse.json(
      {
        success: true,
        messageId,
        sentTo: phoneNumber,
        message: message,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error sending test SMS:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send SMS',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
