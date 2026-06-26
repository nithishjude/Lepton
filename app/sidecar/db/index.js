import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'provenance.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS contributors (
    id TEXT PRIMARY KEY, -- uuid
    mbid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    wallet_address TEXT,
    wallet_id TEXT,
    is_provisioned INTEGER DEFAULT 0,
    is_escrow INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS provenance_graphs (
    mbid TEXT PRIMARY KEY,
    graph_json TEXT NOT NULL,
    arc_tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payment_ticks (
    id TEXT PRIMARY KEY,
    track_mbid TEXT NOT NULL,
    contributor_mbid TEXT NOT NULL,
    amount_usdc TEXT NOT NULL,
    nanopay_ref TEXT,
    arc_batch_hash TEXT,
    tick_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export { db };
