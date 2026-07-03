import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export interface DbMerchant {
  id: string;
  user_id: string;
  name: string;
  api_key: string;
  api_secret_hash: string;
  webhook_url?: string;
  is_active: boolean;
  supported_currencies: string[];
  created_at: Date;
}

@Injectable()
export class MerchantsService {
  constructor(private readonly db: DatabaseService) {}

  async register(userId: string, name: string, webhookUrl?: string) {
    const apiKey = `eb_${randomBytes(24).toString('hex')}`;
    const apiSecret = randomBytes(32).toString('hex');
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);

    const rows = await this.db.query<DbMerchant>(
      `INSERT INTO merchants (user_id, name, api_key, api_secret_hash, webhook_url, supported_currencies)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, apiKey, apiSecretHash, webhookUrl, ['USD', 'EUR', 'RUB']],
    );

    return {
      merchant: this.format(rows[0]),
      apiKey,
      apiSecret,
      warning: 'Save apiSecret now — it will not be shown again',
    };
  }

  async findByApiKey(apiKey: string): Promise<DbMerchant | null> {
    return this.db.queryOne<DbMerchant>(
      'SELECT * FROM merchants WHERE api_key = $1 AND is_active = true',
      [apiKey],
    );
  }

  async verifySecret(merchant: DbMerchant, secret: string): Promise<boolean> {
    return bcrypt.compare(secret, merchant.api_secret_hash);
  }

  async findByUser(userId: string) {
    const merchants = await this.db.query<DbMerchant>(
      'SELECT * FROM merchants WHERE user_id = $1',
      [userId],
    );
    return merchants.map((m) => this.format(m));
  }

  async findById(id: string, userId?: string) {
    const merchant = userId
      ? await this.db.queryOne<DbMerchant>(
          'SELECT * FROM merchants WHERE id = $1 AND user_id = $2',
          [id, userId],
        )
      : await this.db.queryOne<DbMerchant>('SELECT * FROM merchants WHERE id = $1', [id]);

    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.format(merchant);
  }

  format(merchant: DbMerchant) {
    return {
      id: merchant.id,
      name: merchant.name,
      apiKey: merchant.api_key,
      webhookUrl: merchant.webhook_url,
      isActive: merchant.is_active,
      supportedCurrencies: merchant.supported_currencies,
      createdAt: merchant.created_at,
    };
  }
}
