import { execSync } from 'node:child_process';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    console.log('No TURSO_DATABASE_URL — skipping remote DB setup (local SQLite is fine).');
    return;
  }

  const client = createClient({ url, authToken });
  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Movie'"
  );
  if (existing.rows.length === 0) {
    const sql = execSync(
      'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
      { encoding: 'utf8' }
    );
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await client.execute(statement);
    }
    console.log(`Applied ${statements.length} SQL statements to Turso.`);
  } else {
    console.log('Turso already has tables.');
  }

  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: process.env });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
