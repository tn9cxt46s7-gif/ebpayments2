import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  private client: import('twilio').Twilio | null = null;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
      // Ленивая загрузка, чтобы не тянуть twilio, если он не настроен
      const twilio = require('twilio');
      this.client = twilio(sid, token);
    }
  }

  isConfigured() {
    return !!this.client && !!process.env.TWILIO_PHONE_NUMBER;
  }

  async sendCode(phone: string, code: string) {
    const body = `EB Payments: ваш код подтверждения — ${code}. Никому его не сообщайте. Действителен 10 минут.`;

    if (!this.client) {
      console.log(`[SMS DEV] To: ${phone} | Code: ${code}`);
      return { sent: false, dev: true };
    }

    await this.client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { sent: true };
  }
}
