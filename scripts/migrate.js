// One-off schema setup for the orders table.
// Run locally with: node scripts/migrate.js
// Uses the direct (non-pooled) connection, per Neon's guidance for migrations.
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED / DATABASE_URL not set. Run `vercel env pull .env.local` first.');
  }

  const client = new Client({ connectionString });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      items JSONB NOT NULL,
      total NUMERIC(10,2) NOT NULL,
      contact TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
  `);

  console.log('Migration complete: orders table is ready.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
