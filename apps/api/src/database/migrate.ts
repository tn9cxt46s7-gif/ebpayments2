import { Pool } from 'pg';
import { MIGRATIONS } from './schema';
import { getPoolConfig } from './db-config';

async function migrate() {
  const pool = new Pool(getPoolConfig());

  try {
    console.log('Running migrations...');
    await pool.query(MIGRATIONS);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
