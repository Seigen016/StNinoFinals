import type { Twilio } from 'twilio'

let twilioClient: Twilio | null = null

function initTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null
  const TwilioPkg = require('twilio')
  return new TwilioPkg(accountSid, authToken)
}

export async function sendSms(phone: string, message: string) {
  if (!phone) {
    console.warn('sendSms called without phone number')
    return false
  }

  // Lazy-init Twilio client
  if (!twilioClient) {
    twilioClient = initTwilioClient()
    if (!twilioClient) {
      console.warn('Twilio client not configured. Skipping SMS send.')
      return false
    }
  }

  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM
  if (!from) {
    console.warn('TWILIO_PHONE_NUMBER is not configured; cannot send SMS')
    return false
  }

  try {
    const result = await twilioClient.messages.create({
      from,
      to: phone,
      body: message,
    })
    console.log('SMS sent successfully:', result.sid)
    return true
  } catch (err: any) {
    console.error('Failed to send SMS:', err?.message || err)
    return false
  }
}
