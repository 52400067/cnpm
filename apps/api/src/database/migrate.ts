import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { db, sqlClient } from './db';

async function runMigrations() {
  console.log('Running database migrations...');
  const migrationsFolder = path.resolve(__dirname, '../../drizzle');
  await migrate(db, { migrationsFolder });
  console.log('Database migrations completed successfully.');
  await sqlClient.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
