import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { MIGRATIONS } from './schema';
import { getPoolConfig } from './db-config';

const EXCHANGE_RATES = [
  { from: 'USD', to: 'EUR', rate: 0.92 },
  { from: 'USD', to: 'RUB', rate: 92.5 },
  { from: 'USD', to: 'KZT', rate: 450.0 },
  { from: 'USD', to: 'BTC', rate: 0.000015 },
  { from: 'USD', to: 'ETH', rate: 0.00035 },
  { from: 'USD', to: 'USDT', rate: 1.0 },
  { from: 'EUR', to: 'USD', rate: 1.09 },
  { from: 'RUB', to: 'USD', rate: 0.0108 },
  { from: 'BTC', to: 'USD', rate: 66666.67 },
  { from: 'ETH', to: 'USD', rate: 2857.14 },
  { from: 'USDT', to: 'USD', rate: 1.0 },
  { from: 'USDT', to: 'RUB', rate: 92.5 },
];

async function seed() {
  const pool = new Pool(getPoolConfig());

  try {
    await pool.query(MIGRATIONS);

    const adminHash = await bcrypt.hash('EbAdmin2026!', 10);
    const platformHash = await bcrypt.hash('platform_internal', 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, kyc_status, country_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $2`,
      ['admin@ebpayments.com', adminHash, 'Админ', 'EB Payments', 'admin', 'verified', 'RU'],
    );

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, kyc_status, country_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      ['platform@ebpayments.com', platformHash, 'EB', 'Platform', 'admin', 'verified', 'US'],
    );

    const adminWallets = ['USD', 'EUR', 'RUB', 'BTC', 'ETH', 'USDT'];
    for (const currency of adminWallets) {
      await pool.query(
        `INSERT INTO wallets (user_id, currency, balance)
         SELECT id, $1, 0 FROM users WHERE email = 'admin@ebpayments.com'
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [currency],
      );
      await pool.query(
        `INSERT INTO wallets (user_id, currency)
         SELECT id, $1 FROM users WHERE email = 'platform@ebpayments.com'
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [currency],
      );
    }

    for (const { from, to, rate } of EXCHANGE_RATES) {
      await pool.query(
        `INSERT INTO exchange_rates (from_currency, to_currency, rate)
         VALUES ($1, $2, $3)
         ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = $3, updated_at = NOW()`,
        [from, to, rate],
      );
    }

    console.log('Готово.');
    console.log('Админ-панель: admin@ebpayments.com / EbAdmin2026!');
    console.log('(Только для владельца — не показывайте клиентам)');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
