import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: import('twilio').Twilio | null = null;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const phone = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !phone) {
      this.logger.warn('Twilio не настроен (нет TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER) — SMS будут только логироваться');
      return;
    }

    if (!sid.startsWith('AC')) {
      this.logger.error(
        `TWILIO_ACCOUNT_SID некорректен: должен начинаться с "AC" (проверьте, не перепутано ли значение с Auth Token). SMS отключены, но приложение продолжит работать.`,
      );
      return;
    }

    try {
      // Ленивая загрузка, чтобы не тянуть twilio, если он не настроен
      const twilio = require('twilio');
      this.client = twilio(sid, token);
    } catch (err) {
      this.logger.error(`Не удалось инициализировать Twilio: ${(err as Error).message}. SMS отключены.`);
      this.client = null;
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

    try {
      await this.client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return { sent: true };
    } catch (err) {
      this.logger.error(`Ошибка отправки SMS через Twilio: ${(err as Error).message}`);
      console.log(`[SMS FALLBACK] To: ${phone} | Code: ${code}`);
      return { sent: false, dev: true };
    }
  }
}
