import type { PoolConfig } from 'pg';

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    'postgresql://eb:eb_secret@localhost:5432/eb_payments'
  );
}

export function getPoolConfig(): PoolConfig {
  const connectionString = getDatabaseUrl();
  const needsSsl =
    process.env.DATABASE_SSL === 'true' ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('render.com');

  return {
    connectionString,
    max: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}
