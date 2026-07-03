import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MerchantsService } from '../merchants/merchants.service';
import { MERCHANT_FEE_PERCENT } from '@eb/shared';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly merchantsService: MerchantsService,
  ) {}

  async createPaymentIntent(
    apiKey: string,
    apiSecret: string,
    data: {
      orderId: string;
      amount: string;
      currency: string;
      callbackUrl?: string;
      description?: string;
    },
  ) {
    const merchant = await this.merchantsService.findByApiKey(apiKey);
    if (!merchant) throw new UnauthorizedException('Invalid API key');

    const valid = await this.merchantsService.verifySecret(merchant, apiSecret);
    if (!valid) throw new UnauthorizedException('Invalid API secret');

    if (!merchant.supported_currencies.includes(data.currency.toUpperCase())) {
      throw new BadRequestException(`Currency ${data.currency} not supported`);
    }

    const existing = await this.db.queryOne(
      'SELECT id FROM merchant_payments WHERE merchant_id = $1 AND order_id = $2',
      [merchant.id, data.orderId],
    );
    if (existing) throw new BadRequestException('Order ID already exists');

    const rows = await this.db.query<{ id: string }>(
      `INSERT INTO merchant_payments (merchant_id, order_id, amount, currency, callback_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        merchant.id,
        data.orderId,
        data.amount,
        data.currency.toUpperCase(),
        data.callbackUrl,
        JSON.stringify({ description: data.description }),
      ],
    );

    return {
      paymentId: rows[0].id,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      status: 'pending',
      payUrl: `${process.env.WEB_URL ?? 'http://localhost:3000'}/pay/${rows[0].id}`,
    };
  }

  async payFromWallet(userId: string, paymentId: string, walletId: string) {
    const payment = await this.db.queryOne<{
      id: string;
      merchant_id: string;
      order_id: string;
      amount: string;
      currency: string;
      status: string;
      callback_url?: string;
    }>('SELECT * FROM merchant_payments WHERE id = $1', [paymentId]);

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Payment already ${payment.status}`);
    }

    const amountNum = parseFloat(payment.amount);
    const fee = amountNum * (MERCHANT_FEE_PERCENT / 100);
    const totalDebit = amountNum + fee;

    return this.db.withTransaction(async (client) => {
      const wallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          walletId,
          userId,
        ])
      ).rows[0];

      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.currency !== payment.currency) {
        throw new BadRequestException('Wallet currency does not match payment');
      }
      if (parseFloat(wallet.balance) < totalDebit) {
        throw new BadRequestException('Insufficient balance');
      }

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [
        totalDebit,
        walletId,
      ]);

      const merchant = (
        await client.query('SELECT user_id FROM merchants WHERE id = $1', [payment.merchant_id])
      ).rows[0];

      const merchantWallet = (
        await client.query(
          'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
          [merchant.user_id, payment.currency],
        )
      ).rows[0];

      if (merchantWallet) {
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [
          amountNum,
          merchantWallet.id,
        ]);
      }

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, status, amount, currency, fee,
          merchant_id, external_order_id, completed_at)
         VALUES ($1, $2, 'merchant_payment', 'completed', $3, $4, $5, $6, $7, NOW()) RETURNING *`,
        [
          userId,
          walletId,
          payment.amount,
          payment.currency,
          fee,
          payment.merchant_id,
          payment.order_id,
        ],
      );

      await client.query(
        `UPDATE merchant_payments SET status = 'completed', transaction_id = $1, completed_at = NOW()
         WHERE id = $2`,
        [txResult.rows[0].id, paymentId],
      );

      return {
        paymentId,
        orderId: payment.order_id,
        status: 'completed',
        transactionId: txResult.rows[0].id,
        amount: payment.amount,
        currency: payment.currency,
        fee: fee.toFixed(8),
      };
    });
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.db.queryOne(
      'SELECT id, order_id, amount, currency, status, created_at, completed_at FROM merchant_payments WHERE id = $1',
      [paymentId],
    );
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
