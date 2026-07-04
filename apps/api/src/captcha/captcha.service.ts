import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Challenge {
  answer: number;
  expiresAt: number;
}

@Injectable()
export class CaptchaService {
  private challenges = new Map<string, Challenge>();
  private readonly TTL_MS = 5 * 60 * 1000;

  usesGoogleRecaptcha() {
    return !!process.env.RECAPTCHA_SECRET_KEY;
  }

  generate() {
    this.cleanup();
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 15) + 1;
    const id = uuidv4();
    this.challenges.set(id, { answer: a + b, expiresAt: Date.now() + this.TTL_MS });
    return {
      captchaId: id,
      question: `Сколько будет ${a} + ${b}?`,
      useRecaptcha: this.usesGoogleRecaptcha(),
    };
  }

  async verifyRegistration(data: {
    captchaId?: string;
    captchaAnswer?: number;
    recaptchaToken?: string;
  }) {
    if (this.usesGoogleRecaptcha()) {
      if (!data.recaptchaToken) {
        throw new BadRequestException('Подтвердите Google reCAPTCHA');
      }
      await this.verifyGoogleRecaptcha(data.recaptchaToken);
      return;
    }

    if (!data.captchaId || data.captchaAnswer === undefined || Number.isNaN(data.captchaAnswer)) {
      throw new BadRequestException('Ответьте на капчу');
    }
    this.verifyMathCaptcha(data.captchaId, data.captchaAnswer);
  }

  private async verifyGoogleRecaptcha(token: string) {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return;

    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      console.error('[CAPTCHA] reCAPTCHA failed:', data['error-codes']);
      throw new BadRequestException('Google reCAPTCHA не пройдена. Попробуйте снова.');
    }
  }

  verifyMathCaptcha(captchaId: string, answer: number) {
    this.cleanup();
    const challenge = this.challenges.get(captchaId);
    if (!challenge) {
      throw new BadRequestException('Капча устарела. Обновите страницу и попробуйте снова.');
    }
    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(captchaId);
      throw new BadRequestException('Капча устарела. Обновите страницу и попробуйте снова.');
    }
    if (challenge.answer !== answer) {
      throw new BadRequestException('Неверный ответ на капчу');
    }
    this.challenges.delete(captchaId);
  }

  /** @deprecated use verifyRegistration */
  verify(captchaId: string, answer: number) {
    this.verifyMathCaptcha(captchaId, answer);
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, c] of this.challenges) {
      if (now > c.expiresAt) this.challenges.delete(id);
    }
  }
}
