import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../data/wts.db');
const MIGRATIONS_PATH = join(__dirname, 'migrations');

let db;

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH, { verbose: logger.debug });
  }
  return db;
}

export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(dirname(DB_PATH), { recursive: true });

    const db = getDatabase();
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Get all migration files
    const files = await fs.readdir(MIGRATIONS_PATH);
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => {
        const numA = parseInt(a.split('_')[0]);
        const numB = parseInt(b.split('_')[0]);
        return numA - numB;
      });

    // Run migrations in transaction
    db.transaction(() => {
      // Create migrations table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Get applied migrations
      const applied = db.prepare('SELECT name FROM migrations').all();
      const appliedSet = new Set(applied.map(m => m.name));

      // Run pending migrations
      for (const migration of migrations) {
        if (!appliedSet.has(migration)) {
          const sql = fs.readFileSync(join(MIGRATIONS_PATH, migration), 'utf8');
          db.exec(sql);
          db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration);
          logger.info(`Applied migration: ${migration}`);
        }
      }
    })();

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Clean up on exit
process.on('SIGINT', () => {
  closeDatabase();
  process.exit();
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit();
});
