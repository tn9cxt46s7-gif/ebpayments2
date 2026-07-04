import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { COUNTRIES } from '@eb/shared';
import { DatabaseService } from '../database/database.service';
import { getBanksForCountry } from '../data/banks';

@Injectable()
export class BanksService {
  constructor(private readonly db: DatabaseService) {}

  getCountries() {
    return COUNTRIES;
  }

  getBanks(countryCode: string) {
    const banks = getBanksForCountry(countryCode);
    return {
      countryCode: countryCode.toUpperCase(),
      banks,
      hasBanks: banks.length > 0,
      message: banks.length === 0
        ? 'Для этой страны доступно пополнение картой, Google Pay и Apple Pay'
        : undefined,
    };
  }

  async getConnected(userId: string) {
    return this.db.query(
      `SELECT id, bank_id, bank_name, country_code, is_verified, connected_at
       FROM connected_banks WHERE user_id = $1 ORDER BY connected_at DESC`,
      [userId],
    );
  }

  async connect(userId: string, countryCode: string, bankId: string) {
    const banks = getBanksForCountry(countryCode);
    const bank = banks.find((b) => b.id === bankId);
    if (!bank) throw new NotFoundException('Банк не найден');

    const existing = await this.db.queryOne(
      'SELECT id FROM connected_banks WHERE user_id = $1 AND bank_id = $2',
      [userId, bankId],
    );
    if (existing) throw new BadRequestException('Банк уже подключён');

    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO connected_banks (user_id, bank_id, bank_name, country_code, is_verified)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [userId, bankId, bank.name, countryCode.toUpperCase()],
    );

    return {
      ...(rows[0] as Record<string, unknown>),
      message: `Банк «${bank.name}» успешно подключён`,
    };
  }

  async disconnect(userId: string, connectionId: string) {
    const result = await this.db.query(
      'DELETE FROM connected_banks WHERE id = $1 AND user_id = $2 RETURNING id',
      [connectionId, userId],
    );
    if (!result.length) throw new NotFoundException('Подключение не найдено');
    return { success: true };
  }
}
