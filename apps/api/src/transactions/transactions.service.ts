import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  async getHistory(userId: string, limit = 50) {
    const rows = await this.db.query(
      `SELECT id, type, status, amount, currency, fee, metadata, created_at, completed_at
       FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );

    const typeLabels: Record<string, string> = {
      deposit: 'Пополнение',
      withdrawal: 'Вывод',
      transfer: 'Перевод',
      exchange: 'Обмен',
      merchant_payment: 'Оплата',
      refund: 'Возврат',
    };

    return rows.map((t: Record<string, unknown>) => ({
      id: t.id,
      type: t.type,
      typeLabel: typeLabels[t.type as string] ?? t.type,
      status: t.status,
      amount: t.amount,
      currency: t.currency,
      fee: t.fee,
      metadata: t.metadata,
      createdAt: t.created_at,
      completedAt: t.completed_at,
    }));
  }
}
