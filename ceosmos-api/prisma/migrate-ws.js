/*
 * Aplica migraciones pendientes de prisma/migrations por el driver serverless de
 * Neon (WebSocket, puerto 443) cuando el puerto 5432 está bloqueado por la red.
 * Hace lo mismo que `prisma migrate deploy`: ejecuta cada migration.sql dentro
 * de una transacción y la registra en _prisma_migrations con su checksum SHA-256.
 *
 *   node prisma/migrate-ws.js           -> muestra el estado
 *   node prisma/migrate-ws.js --apply   -> aplica las pendientes
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function main() {
  const apply = process.argv.includes('--apply');
  const dir = path.join(__dirname, 'migrations');
  const local = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'migration.sql'))).sort();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at',
    );
    const applied = new Map(rows.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => [r.migration_name, r.checksum]));
    const pending = [];
    for (const name of local) {
      const sql = fs.readFileSync(path.join(dir, name, 'migration.sql'));
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      if (applied.has(name)) {
        const ok = applied.get(name) === checksum;
        console.log(`${ok ? 'aplicada ' : 'CHECKSUM DISTINTO'}  ${name}`);
      } else {
        console.log(`pendiente  ${name}`);
        pending.push({ name, sql: sql.toString('utf8'), checksum });
      }
    }
    if (!apply || pending.length === 0) return;
    for (const m of pending) {
      const id = crypto.randomUUID();
      await client.query('BEGIN');
      try {
        await client.query(
          'INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count) VALUES ($1, $2, $3, now(), 0)',
          [id, m.checksum, m.name],
        );
        await client.query(m.sql);
        await client.query(
          'UPDATE _prisma_migrations SET finished_at = now(), applied_steps_count = 1 WHERE id = $1',
          [id],
        );
        await client.query('COMMIT');
        console.log(`APLICADA   ${m.name}`);
      } catch (e) {
        await client.query('ROLLBACK');
        throw new Error(`${m.name}: ${e.message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
