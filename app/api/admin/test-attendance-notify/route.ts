import { EmailService } from '@/lib/services/email-service';
import { TextBeeService } from '@/services/textbee';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, studentName, gradeLevel, section, scanType } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'Provide at least an email or phone number' },
        { status: 400 }
      );
    }

    const name = studentName || 'Test Student';
    const grade = gradeLevel || 'Grade 7';
    const sec = section || 'Section A';
    const type: 'timein' | 'timeout' = scanType === 'timeout' ? 'timeout' : 'timein';
    const scanTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

    const results: { email?: string; sms?: string } = {};

    // Send email
    if (email) {
      try {
        await EmailService.sendAttendanceNotification({
          parentEmail: email,
          studentName: name,
          gradeLevel: grade,
          section: sec,
          scanType: type,
          scanTime,
        });
        results.email = 'sent';
      } catch (err: any) {
        results.email = `failed: ${err?.message || 'Unknown error'}`;
      }
    }

    // Send SMS
    if (phone) {
      try {
        let formattedPhone = phone.toString().trim();
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+63' + formattedPhone.slice(1);
        }

        const scanTypeText = type === 'timein' ? 'timed in' : 'timed out';
        const message = `Dear parent, ${name} (${grade} - ${sec}) ${scanTypeText} at ${scanTime}. — Sto Niño Portal`;

        const messageId = await TextBeeService.sendSms(formattedPhone, message);
        results.sms = `sent (ID: ${messageId})`;
      } catch (err: any) {
        results.sms = `failed: ${err?.message || 'Unknown error'}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      results,
      details: { studentName: name, gradeLevel: grade, section: sec, scanType: type, scanTime },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
