/**
 * Migration Runner
 * Usage: node runner.js up|down
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getExecutedMigrations() {
  const result = await pool.query(
    'SELECT name FROM schema_migrations ORDER BY id'
  );
  return result.rows.map((r) => r.name);
}

async function getMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter((f) => f.match(/^\d{3}_.*\.js$/) && f !== 'runner.js')
    .sort();
  return files;
}

async function runUp() {
  await ensureMigrationTable();
  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();

  const pending = files.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    console.log(`Running migration: ${file}`);
    const migration = require(path.join(__dirname, file));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.up);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`  ✓ ${file} completed`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ ${file} failed:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(`\nAll migrations complete (${pending.length} executed).`);
}

async function runDown() {
  await ensureMigrationTable();
  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    console.log('No migrations to rollback.');
    return;
  }

  // Roll back the last migration
  const lastMigration = executed[executed.length - 1];
  console.log(`Rolling back: ${lastMigration}`);

  const migration = require(path.join(__dirname, lastMigration));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration.down);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [
      lastMigration,
    ]);
    await client.query('COMMIT');
    console.log(`  ✓ ${lastMigration} rolled back`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Rollback failed:`, err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

const command = process.argv[2];

(async () => {
  try {
    if (command === 'up') {
      await runUp();
    } else if (command === 'down') {
      await runDown();
    } else {
      console.log('Usage: node runner.js up|down');
    }
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
