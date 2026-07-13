import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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

    // Учётные данные админа берутся из окружения (ADMIN_EMAIL/ADMIN_PASSWORD).
    // Если не заданы — генерируется случайный одноразовый пароль (виден только в этом выводе, нигде не сохраняется).
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ebpayments.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(12).toString('base64url');
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const platformEmail = process.env.PLATFORM_EMAIL ?? 'platform@ebpayments.com';
    const platformPassword = process.env.PLATFORM_PASSWORD ?? crypto.randomBytes(12).toString('base64url');
    const platformHash = await bcrypt.hash(platformPassword, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, kyc_status, country_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $2`,
      [adminEmail, adminHash, 'Админ', 'EB Payments', 'admin', 'verified', 'RU'],
    );

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, kyc_status, country_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [platformEmail, platformHash, 'EB', 'Platform', 'admin', 'verified', 'US'],
    );

    const adminWallets = ['USD', 'EUR', 'RUB', 'BTC', 'ETH', 'USDT'];
    for (const currency of adminWallets) {
      await pool.query(
        `INSERT INTO wallets (user_id, currency, balance)
         SELECT id, $1, 0 FROM users WHERE email = $2
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [currency, adminEmail],
      );
      await pool.query(
        `INSERT INTO wallets (user_id, currency)
         SELECT id, $1 FROM users WHERE email = $2
         ON CONFLICT (user_id, currency) DO NOTHING`,
        [currency, platformEmail],
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
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`Сгенерирован временный пароль админа: ${adminEmail} / ${adminPassword}`);
      console.log('Сохраните его в надёжном месте и задайте ADMIN_PASSWORD в .env, чтобы он не менялся при следующем seed.');
    } else {
      console.log(`Админ-панель: ${adminEmail} (пароль задан через ADMIN_PASSWORD)`);
    }
    console.log('(Только для владельца — не показывайте клиентам и не публикуйте в репозитории)');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
