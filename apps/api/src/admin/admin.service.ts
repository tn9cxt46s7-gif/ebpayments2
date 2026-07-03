import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly platform: PlatformService,
  ) {}

  async getStats() {
    const [users, transactions, volume] = await Promise.all([
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE role = $1', ['user']),
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM transactions'),
      this.db.queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(fee), 0) as total FROM transactions WHERE fee > 0`,
      ),
    ]);

    const revenue = await this.platform.getRevenue();

    return {
      totalUsers: parseInt(users?.count ?? '0'),
      totalTransactions: parseInt(transactions?.count ?? '0'),
      totalFeesCollected: volume?.total ?? '0',
      platformRevenue: revenue,
    };
  }

  async getUsers() {
    const rows = await this.db.query(
      `SELECT id, email, first_name, last_name, role, kyc_status, country_code, created_at
       FROM users ORDER BY created_at DESC LIMIT 200`,
    );
    return rows.map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      kycStatus: u.kyc_status,
      countryCode: u.country_code,
      createdAt: u.created_at,
    }));
  }

  async getAllTransactions(limit = 100) {
    return this.db.query(
      `SELECT t.*, u.email as user_email
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC LIMIT $1`,
      [limit],
    );
  }
}
