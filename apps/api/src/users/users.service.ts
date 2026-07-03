import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DbUser {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  kyc_status: string;
  country_code: string;
  is_active: boolean;
  created_at: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<DbUser | null> {
    return this.db.queryOne<DbUser>('SELECT * FROM users WHERE email = $1', [email]);
  }

  async findById(id: string): Promise<DbUser | null> {
    return this.db.queryOne<DbUser>('SELECT * FROM users WHERE id = $1', [id]);
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    locale?: string;
    gdprConsent?: boolean;
  }): Promise<DbUser> {
    const rows = await this.db.query<DbUser>(
      `INSERT INTO users (email, password_hash, first_name, last_name, country_code, locale, gdpr_consent, gdpr_consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [data.email, data.passwordHash, data.firstName, data.lastName, data.countryCode, data.locale ?? 'ru', data.gdprConsent ?? false],
    );
    return rows[0];
  }

  async createDefaultWallets(userId: string) {
    const currencies = ['USD', 'EUR', 'RUB', 'BTC', 'ETH', 'USDT'];
    for (const currency of currencies) {
      await this.db.query(
        `INSERT INTO wallets (user_id, currency) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, currency],
      );
    }
  }

  sanitize(user: DbUser) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      kycStatus: user.kyc_status,
      countryCode: user.country_code,
      createdAt: user.created_at,
    };
  }
}
