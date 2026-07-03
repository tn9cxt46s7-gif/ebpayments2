import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DbWallet {
  id: string;
  user_id: string;
  currency: string;
  balance: string;
  frozen_balance: string;
  is_active: boolean;
  created_at: Date;
}

@Injectable()
export class WalletsService {
  constructor(private readonly db: DatabaseService) {}

  async findByUser(userId: string): Promise<DbWallet[]> {
    return this.db.query<DbWallet>(
      'SELECT * FROM wallets WHERE user_id = $1 AND is_active = true ORDER BY currency',
      [userId],
    );
  }

  async findById(walletId: string, userId?: string): Promise<DbWallet> {
    const wallet = userId
      ? await this.db.queryOne<DbWallet>(
          'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
          [walletId, userId],
        )
      : await this.db.queryOne<DbWallet>('SELECT * FROM wallets WHERE id = $1', [walletId]);

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(userId: string, currency: string): Promise<DbWallet> {
    const existing = await this.db.queryOne(
      'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2',
      [userId, currency],
    );
    if (existing) throw new BadRequestException('Wallet for this currency already exists');

    const rows = await this.db.query<DbWallet>(
      'INSERT INTO wallets (user_id, currency) VALUES ($1, $2) RETURNING *',
      [userId, currency],
    );
    return rows[0];
  }

  format(wallet: DbWallet) {
    return {
      id: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance,
      frozenBalance: wallet.frozen_balance,
      availableBalance: (
        parseFloat(wallet.balance) - parseFloat(wallet.frozen_balance)
      ).toFixed(8),
      isActive: wallet.is_active,
      createdAt: wallet.created_at,
    };
  }
}
