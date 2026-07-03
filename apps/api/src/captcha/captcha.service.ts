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

  generate() {
    this.cleanup();
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 15) + 1;
    const id = uuidv4();
    this.challenges.set(id, { answer: a + b, expiresAt: Date.now() + this.TTL_MS });
    return {
      captchaId: id,
      question: `Сколько будет ${a} + ${b}?`,
    };
  }

  verify(captchaId: string, answer: number) {
    this.cleanup();
    const challenge = this.challenges.get(captchaId);
    if (!challenge) throw new BadRequestException('Капча устарела. Обновите и попробуйте снова.');
    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(captchaId);
      throw new BadRequestException('Капча устарела. Обновите и попробуйте снова.');
    }
    if (challenge.answer !== answer) {
      throw new BadRequestException('Неверный ответ на капчу');
    }
    this.challenges.delete(captchaId);
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, c] of this.challenges) {
      if (now > c.expiresAt) this.challenges.delete(id);
    }
  }
}
