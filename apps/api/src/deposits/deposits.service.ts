import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlatformService } from '../platform/platform.service';
import { EmailService } from '../email/email.service';
import { DEPOSIT_FEE_PERCENT, calcNetAfterFee } from '@eb/shared';

@Injectable()
export class DepositsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly platform: PlatformService,
    private readonly email: EmailService,
  ) {}

  preview(amount: string) {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) throw new BadRequestException('Сумма должна быть больше нуля');
    const { fee, net } = calcNetAfterFee(amountNum, DEPOSIT_FEE_PERCENT);
    return {
      amount: amountNum.toFixed(8),
      feePercent: DEPOSIT_FEE_PERCENT,
      fee: fee.toFixed(8),
      credited: net.toFixed(8),
      message: `Комиссия платформы ${DEPOSIT_FEE_PERCENT}% — ${fee.toFixed(2)}`,
    };
  }

  async deposit(
    userId: string,
    walletId: string,
    amount: string,
    method: 'card' | 'bank' | 'crypto',
  ) {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) throw new BadRequestException('Сумма должна быть больше нуля');

    const { fee, net } = calcNetAfterFee(amountNum, DEPOSIT_FEE_PERCENT);

    return this.db.withTransaction(async (client) => {
      const wallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          walletId,
          userId,
        ])
      ).rows[0];

      if (!wallet) throw new NotFoundException('Кошелёк не найден');

      await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [
        net,
        walletId,
      ]);

      await this.platform.collectFee(wallet.currency, fee, client);

      const tx = (
        await client.query(
          `INSERT INTO transactions (user_id, wallet_id, type, status, amount, currency, fee, metadata, completed_at)
           VALUES ($1, $2, 'deposit', 'completed', $3, $4, $5, $6, NOW()) RETURNING *`,
          [
            userId,
            walletId,
            amount,
            wallet.currency,
            fee,
            JSON.stringify({ method, credited: net.toFixed(8) }),
          ],
        )
      ).rows[0];

      const userRow = await this.db.queryOne<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
      if (userRow?.email) {
        await this.email.sendReceipt(userRow.email, {
          amount: net.toFixed(2),
          currency: wallet.currency,
          type: 'Пополнение',
          fee: fee.toFixed(2),
          id: tx.id as string,
        });
      }

      return {
        transactionId: tx.id,
        deposited: amount,
        fee: fee.toFixed(8),
        feePercent: DEPOSIT_FEE_PERCENT,
        credited: net.toFixed(8),
        currency: wallet.currency,
        method,
        message: `Зачислено ${net.toFixed(2)} ${wallet.currency} (комиссия ${DEPOSIT_FEE_PERCENT}%: ${fee.toFixed(2)})`,
      };
    });
  }
}
