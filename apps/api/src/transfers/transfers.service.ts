import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { PlatformService } from '../platform/platform.service';
import { TRANSFER_FEE_PERCENT, CRYPTO_CURRENCIES } from '@eb/shared';

@Injectable()
export class TransfersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
    private readonly platform: PlatformService,
  ) {}

  async send(
    userId: string,
    fromWalletId: string,
    amount: string,
    options: { toEmail?: string; toWalletId?: string; note?: string },
  ) {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) throw new BadRequestException('Сумма должна быть больше нуля');

    let recipientUserId: string;
    let recipientWalletId: string;

    if (options.toEmail) {
      const recipient = await this.usersService.findByEmail(options.toEmail);
      if (!recipient) throw new NotFoundException('Получатель не найден');

      const fromWallet = await this.db.queryOne<{ currency: string }>(
        'SELECT currency FROM wallets WHERE id = $1 AND user_id = $2',
        [fromWalletId, userId],
      );
      if (!fromWallet) throw new NotFoundException('Кошелёк не найден');

      const toWallet = await this.db.queryOne<{ id: string }>(
        'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2',
        [recipient.id, fromWallet.currency],
      );
      if (!toWallet) {
        throw new BadRequestException(`У получателя нет кошелька ${fromWallet.currency}`);
      }

      recipientUserId = recipient.id;
      recipientWalletId = toWallet.id;
    } else if (options.toWalletId) {
      const toWallet = await this.db.queryOne<{ id: string; user_id: string; currency: string }>(
        'SELECT * FROM wallets WHERE id = $1',
        [options.toWalletId],
      );
      if (!toWallet) throw new NotFoundException('Кошелёк получателя не найден');

      const fromWallet = await this.db.queryOne<{ currency: string }>(
        'SELECT currency FROM wallets WHERE id = $1 AND user_id = $2',
        [fromWalletId, userId],
      );
      if (!fromWallet) throw new NotFoundException('Кошелёк не найден');
      if (fromWallet.currency !== toWallet.currency) {
        throw new BadRequestException('Валюты не совпадают — используйте обмен');
      }

      recipientUserId = toWallet.user_id;
      recipientWalletId = toWallet.id;
    } else {
      throw new BadRequestException('Укажите email или ID кошелька получателя');
    }

    if (recipientUserId === userId) {
      throw new BadRequestException('Нельзя переводить самому себе');
    }

    const fee = amountNum * (TRANSFER_FEE_PERCENT / 100);
    const totalDebit = amountNum + fee;

    return this.db.withTransaction(async (client) => {
      const fromWallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          fromWalletId,
          userId,
        ])
      ).rows[0];

      if (!fromWallet) throw new NotFoundException('Кошелёк не найден');
      if (parseFloat(fromWallet.balance) < totalDebit) {
        throw new BadRequestException('Недостаточно средств (включая комиссию 3%)');
      }

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [
        totalDebit,
        fromWalletId,
      ]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [
        amountNum,
        recipientWalletId,
      ]);

      await this.platform.collectFee(fromWallet.currency, fee, client);

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, status, amount, currency, fee,
          counterparty_user_id, counterparty_wallet_id, metadata, completed_at)
         VALUES ($1, $2, 'transfer', 'completed', $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [
          userId,
          fromWalletId,
          amount,
          fromWallet.currency,
          fee,
          recipientUserId,
          recipientWalletId,
          JSON.stringify({ note: options.note }),
        ],
      );

      return {
        transaction: txResult.rows[0],
        fee: fee.toFixed(8),
        feePercent: TRANSFER_FEE_PERCENT,
        totalDebited: totalDebit.toFixed(8),
        message: `Перевод выполнен. Комиссия: ${fee.toFixed(2)} ${fromWallet.currency}`,
      };
    });
  }

  async sendCrypto(
    userId: string,
    fromWalletId: string,
    amount: string,
    address: string,
    network?: string,
  ) {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) throw new BadRequestException('Сумма должна быть больше нуля');
    if (!address || address.length < 10) {
      throw new BadRequestException('Укажите корректный адрес кошелька');
    }

    const fee = amountNum * (TRANSFER_FEE_PERCENT / 100);
    const totalDebit = amountNum + fee;

    return this.db.withTransaction(async (client) => {
      const fromWallet = (
        await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [
          fromWalletId,
          userId,
        ])
      ).rows[0];

      if (!fromWallet) throw new NotFoundException('Кошелёк не найден');
      if (!(CRYPTO_CURRENCIES as readonly string[]).includes(fromWallet.currency)) {
        throw new BadRequestException('Это не криптовалютный кошелёк');
      }
      if (parseFloat(fromWallet.balance) < totalDebit) {
        throw new BadRequestException('Недостаточно средств (включая комиссию 3%)');
      }

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [
        totalDebit,
        fromWalletId,
      ]);

      await this.platform.collectFee(fromWallet.currency, fee, client);

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, wallet_id, type, status, amount, currency, fee, metadata, completed_at)
         VALUES ($1, $2, 'withdrawal', 'completed', $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          userId,
          fromWalletId,
          amount,
          fromWallet.currency,
          fee,
          JSON.stringify({ address, network: network ?? fromWallet.currency, type: 'crypto_send' }),
        ],
      );

      return {
        transactionId: txResult.rows[0].id,
        amount,
        fee: fee.toFixed(8),
        feePercent: TRANSFER_FEE_PERCENT,
        currency: fromWallet.currency,
        address,
        message: `Крипто-перевод ${amount} ${fromWallet.currency} отправлен на ${address}`,
      };
    });
  }
}
