import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';

const PLATFORM_EMAIL = 'platform@ebpayments.com';

@Injectable()
export class PlatformService {
  constructor(private readonly db: DatabaseService) {}

  async collectFee(currency: string, fee: number, client?: PoolClient) {
    if (fee <= 0) return;

    const q = client
      ? (text: string, params?: unknown[]) => client.query(text, params)
      : (text: string, params?: unknown[]) => this.db.getPool().query(text, params);

    const platformUser = (
      await q('SELECT id FROM users WHERE email = $1', [PLATFORM_EMAIL])
    ).rows[0];

    if (!platformUser) return;

    let wallet = (
      await q('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [
        platformUser.id,
        currency.toUpperCase(),
      ])
    ).rows[0];

    if (!wallet) {
      wallet = (
        await q(
          'INSERT INTO wallets (user_id, currency) VALUES ($1, $2) RETURNING id',
          [platformUser.id, currency.toUpperCase()],
        )
      ).rows[0];
    }

    await q('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [fee, wallet.id]);
  }

  async getRevenue() {
    const rows = await this.db.query<{ currency: string; total: string }>(
      `SELECT w.currency, w.balance as total
       FROM wallets w
       JOIN users u ON u.id = w.user_id
       WHERE u.email = $1 AND w.balance > 0`,
      [PLATFORM_EMAIL],
    );
    return rows;
  }
}
