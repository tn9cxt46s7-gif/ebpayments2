import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlatformService } from '../platform/platform.service';
import { EXCHANGE_FEE_PERCENT } from '@eb/shared';

interface ExchangeRateRow {
  from_currency: string;
  to_currency: string;
  rate: string;
  spread: string;
}

@Injectable()
export class ExchangeService {
  constructor(
    private readonly db: DatabaseService,
    private readonly platform: PlatformService,
  ) {}

  async getRates(fromCurrency?: string) {
    const query = fromCurrency
      ? 'SELECT * FROM exchange_rates WHERE from_currency = $1 ORDER BY to_currency'
      : 'SELECT * FROM exchange_rates ORDER BY from_currency, to_currency';
    const params = fromCurrency ? [fromCurrency.toUpperCase()] : [];
    const rates = await this.db.query<ExchangeRateRow>(query, params);

    return rates.map((r) => ({
      fromCurrency: r.from_currency,
      toCurrency: r.to_currency,
      rate: r.rate,
      spread: r.spread,
      effectiveRate: (parseFloat(r.rate) * (1 - parseFloat(r.spread))).toFixed(8),
    }));
  }

  async getQuote(fromCurrency: string, toCurrency: string, amount: string) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    const amountNum = parseFloat(amount);
    const effectiveRate = parseFloat(rate.rate) * (1 - parseFloat(rate.spread));
    const fee = amountNum * (EXCHANGE_FEE_PERCENT / 100);
    const received = (amountNum - fee) * effectiveRate;

    return {
      fromCurrency,
      toCurrency,
      amount,
      rate: rate.rate,
      spread: rate.spread,
      effectiveRate: effectiveRate.toFixed(8),
      fee: fee.toFixed(8),
      feePercent: EXCHANGE_FEE_PERCENT,
      receivedAmount: received.toFixed(8),
    };
  }

  async execute(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: string,
  ) {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) throw new BadRequestException('Сумма должна быть больше нуля');

    return this.db.withTransaction(async (client) => {
      const fromWallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          fromWalletId,
          userId,
        ])
      ).rows[0];

      const toWallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          toWalletId,
          userId,
        ])
      ).rows[0];

      if (!fromWallet || !toWallet) throw new BadRequestException('Кошелёк не найден');
      if (parseFloat(fromWallet.balance) < amountNum) {
        throw new BadRequestException('Недостаточно средств');
      }

      const rate = await this.getRate(fromWallet.currency, toWallet.currency);
      const effectiveRate = parseFloat(rate.rate) * (1 - parseFloat(rate.spread));
      const fee = amountNum * (EXCHANGE_FEE_PERCENT / 100);
      const received = (amountNum - fee) * effectiveRate;

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [
        amountNum,
        fromWalletId,
      ]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [
        received,
        toWalletId,
      ]);

      await this.platform.collectFee(fromWallet.currency, fee, client);

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, status, amount, currency, fee, metadata, completed_at)
         VALUES ($1, $2, 'exchange', 'completed', $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          userId,
          fromWalletId,
          amount,
          fromWallet.currency,
          fee,
          JSON.stringify({
            toWalletId,
            toCurrency: toWallet.currency,
            receivedAmount: received.toFixed(8),
            rate: rate.rate,
          }),
        ],
      );

      return {
        transaction: txResult.rows[0],
        receivedAmount: received.toFixed(8),
        toCurrency: toWallet.currency,
        fee: fee.toFixed(8),
        feePercent: EXCHANGE_FEE_PERCENT,
      };
    });
  }

  private async getRate(from: string, to: string): Promise<ExchangeRateRow> {
    const direct = await this.db.queryOne<ExchangeRateRow>(
      'SELECT * FROM exchange_rates WHERE from_currency = $1 AND to_currency = $2',
      [from.toUpperCase(), to.toUpperCase()],
    );
    if (direct) return direct;

    const reverse = await this.db.queryOne<ExchangeRateRow>(
      'SELECT * FROM exchange_rates WHERE from_currency = $1 AND to_currency = $2',
      [to.toUpperCase(), from.toUpperCase()],
    );
    if (reverse) {
      return {
        from_currency: from.toUpperCase(),
        to_currency: to.toUpperCase(),
        rate: (1 / parseFloat(reverse.rate)).toFixed(8),
        spread: reverse.spread,
      };
    }

    throw new BadRequestException(`Exchange rate not available for ${from}/${to}`);
  }
}
