import axios from 'axios';

const baseUrl = 'https://api.textbee.dev/api/v1';
const apiKey = process.env.TEXTBEE_API_KEY;
const deviceId = process.env.TEXTBEE_DEVICE_ID;
export class TextBeeService {
  static async sendSms(to: string, message: string): Promise<string> {
    let recipient = to;
    if (to.startsWith('0')) {
      recipient = '+63' + to.slice(1);
    }
    try {
      let response = await axios.post(
        `${baseUrl}/gateway/devices/${deviceId}/send-sms`,
        {
          recipients: [recipient],
          message: message,
        },
        { headers: { 'x-api-key': apiKey } }
      );
      return response.data.messageId;
    } catch (e) {
      console.error('Error sending SMS via TextBee:', e);
      throw e;
    }
  }
}
