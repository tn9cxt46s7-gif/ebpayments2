import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DepositsService } from '../deposits/deposits.service';
import Stripe from 'stripe';

@Injectable()
export class StripePaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly deposits: DepositsService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  isConfigured() {
    return !!this.stripe;
  }

  getPublishableKey() {
    return process.env.STRIPE_PUBLISHABLE_KEY ?? '';
  }

  async createPaymentIntent(
    userId: string,
    walletId: string,
    amount: string,
    currency: string,
    method: 'card' | 'google_pay' | 'apple_pay',
  ) {
    const amountNum = parseFloat(amount);
    if (amountNum < 1) throw new BadRequestException('Минимальная сумма — 1');

    const wallet = await this.db.queryOne<{ id: string; currency: string; user_id: string }>(
      'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, userId],
    );
    if (!wallet) throw new NotFoundException('Кошелёк не найден');

    const stripeCurrency = currency.toLowerCase();
    const amountCents = Math.round(amountNum * 100);

    if (!this.stripe) {
      const pending = await this.db.query<{ id: string }>(
        `INSERT INTO stripe_payments (user_id, wallet_id, amount, currency, method, status)
         VALUES ($1, $2, $3, $4, $5, 'simulated') RETURNING id`,
        [userId, walletId, amount, currency.toUpperCase(), method],
      );
      const result = await this.deposits.deposit(userId, walletId, amount, method === 'card' ? 'card' : 'crypto');
      await this.db.query(
        `UPDATE stripe_payments SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [pending[0].id],
      );
      return {
        mode: 'simulated' as const,
        ...result,
        notice: 'Тестовый режим: платёж зачислен. Для реальных платежей добавьте STRIPE_SECRET_KEY в .env',
      };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: stripeCurrency === 'rub' ? 'rub' : stripeCurrency === 'eur' ? 'eur' : 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        walletId,
        ebAmount: amount,
        ebCurrency: currency.toUpperCase(),
        method,
      },
    });

    await this.db.query(
      `INSERT INTO stripe_payments (user_id, wallet_id, amount, currency, method, stripe_intent_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [userId, walletId, amount, currency.toUpperCase(), method, intent.id],
    );

    return {
      mode: 'stripe',
      clientSecret: intent.client_secret,
      publishableKey: this.getPublishableKey(),
      paymentIntentId: intent.id,
    };
  }

  async confirmSimulated(paymentIntentId: string, userId: string) {
    if (this.stripe) {
      throw new BadRequestException('Используйте Stripe для подтверждения');
    }
    return { success: true };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return { received: true };

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { userId, walletId, ebAmount } = intent.metadata;
      if (userId && walletId && ebAmount) {
        await this.deposits.deposit(userId, walletId, ebAmount, 'card');
        await this.db.query(
          `UPDATE stripe_payments SET status = 'completed', completed_at = NOW()
           WHERE stripe_intent_id = $1`,
          [intent.id],
        );
      }
    }

    return { received: true };
  }
}
