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

  CREATE TABLE IF NOT EXISTS corrections (
    id TEXT PRIMARY KEY,
    track_mbid TEXT NOT NULL,
    correction_json TEXT NOT NULL,
    arc_tx_hash TEXT,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('[DB] Seeding default tracks...');
  
  // 1. Midnight in Memphis
  const mbid1 = 'f980fc14-e29b-481d-ad3a-5ed9b4ab6340';
  const graph1 = {
    mbid: mbid1,
    title: 'Midnight in Memphis',
    artist: 'J. Cole',
    nodes: [
      { mbid: 'artist-jcole', name: 'J. Cole', role: 'artist' },
      { mbid: 'producer-kesta', name: 'Kesta', role: 'producer' },
      { mbid: 'composer-chris', name: 'Chris Zabriskie', role: 'composer' }
    ],
    edges: [
      { from: 'artist-jcole', to: mbid1, relationship: 'artist' },
      { from: 'producer-kesta', to: mbid1, relationship: 'producer' },
      { from: 'composer-chris', to: mbid1, relationship: 'composer' }
    ],
    splits: [
      { mbid: 'artist-jcole', name: 'J. Cole', bps: 5000, walletAddress: '0xaB0a6fa70cf9C3b6B15C9a55424B664682b31a28' },
      { mbid: 'producer-kesta', name: 'Kesta', bps: 3000, walletAddress: '0x399b4e9fad179b5d768d6d90945a2d4f799553b1' },
      { mbid: 'composer-chris', name: 'Chris Zabriskie', bps: 2000, walletAddress: '0x8b3fca210b3fd0e3c881c19875411a01103c8810' }
    ]
  };
  
  // 2. Creative Commons Beats
  const mbid2 = 'e0218f3e-993a-4f4e-ae3e-626330dea13d';
  const graph2 = {
    mbid: mbid2,
    title: 'Creative Commons Beats',
    artist: 'Kesta',
    nodes: [
      { mbid: 'producer-kesta', name: 'Kesta', role: 'artist' },
      { mbid: 'composer-chris', name: 'Chris Zabriskie', role: 'composer' }
    ],
    edges: [
      { from: 'producer-kesta', to: mbid2, relationship: 'artist' },
      { from: 'composer-chris', to: mbid2, relationship: 'composer' }
    ],
    splits: [
      { mbid: 'producer-kesta', name: 'Kesta', bps: 7000, walletAddress: '0x399b4e9fad179b5d768d6d90945a2d4f799553b1' },
      { mbid: 'composer-chris', name: 'Chris Zabriskie', bps: 3000, walletAddress: '0x8b3fca210b3fd0e3c881c19875411a01103c8810' }
    ]
  };

  // 3. Free Flowing Waters
  const mbid3 = 'cb61a0f8-c2b6-4ad1-9ef0-e0cb218f399a';
  const graph3 = {
    mbid: mbid3,
    title: 'Free Flowing Waters',
    artist: 'Chris Zabriskie',
    nodes: [
      { mbid: 'composer-chris', name: 'Chris Zabriskie', role: 'artist' },
      { mbid: 'artist-jcole', name: 'J. Cole', role: 'featured_artist' }
    ],
    edges: [
      { from: 'composer-chris', to: mbid3, relationship: 'artist' },
      { from: 'artist-jcole', to: mbid3, relationship: 'featured_artist' }
    ],
    splits: [
      { mbid: 'composer-chris', name: 'Chris Zabriskie', bps: 8000, walletAddress: '0x8b3fca210b3fd0e3c881c19875411a01103c8810' },
      { mbid: 'artist-jcole', name: 'J. Cole', bps: 2000, walletAddress: '0xaB0a6fa70cf9C3b6B15C9a55424B664682b31a28' }
    ]
  };

  db.prepare('INSERT OR REPLACE INTO provenance_graphs (mbid, graph_json, arc_tx_hash) VALUES (?, ?, ?)').run(mbid1, JSON.stringify(graph1), '0x4b89c2992f9eac83a12d55ab95547b34e65ac939a8f8ae522200f69547014bc5');
  db.prepare('INSERT OR REPLACE INTO provenance_graphs (mbid, graph_json, arc_tx_hash) VALUES (?, ?, ?)').run(mbid2, JSON.stringify(graph2), '0x4b89c2992f9eac83a12d55ab95547b34e65ac939a8f8ae522200f69547014bc5');
  db.prepare('INSERT OR REPLACE INTO provenance_graphs (mbid, graph_json, arc_tx_hash) VALUES (?, ?, ?)').run(mbid3, JSON.stringify(graph3), '0x4b89c2992f9eac83a12d55ab95547b34e65ac939a8f8ae522200f69547014bc5');

  // Seed contributors table
  db.prepare(`
    INSERT OR IGNORE INTO contributors (id, mbid, name, wallet_address, wallet_id, is_provisioned, is_escrow)
    VALUES ('artist-jcole-id', 'artist-jcole', 'J. Cole', '0xaB0a6fa70cf9C3b6B15C9a55424B664682b31a28', 'wallet-jcole', 1, 0)
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO contributors (id, mbid, name, wallet_address, wallet_id, is_provisioned, is_escrow)
    VALUES ('producer-kesta-id', 'producer-kesta', 'Kesta', '0x399b4e9fad179b5d768d6d90945a2d4f799553b1', 'wallet-kesta', 1, 0)
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO contributors (id, mbid, name, wallet_address, wallet_id, is_provisioned, is_escrow)
    VALUES ('composer-chris-id', 'composer-chris', 'Chris Zabriskie', '0x8b3fca210b3fd0e3c881c19875411a01103c8810', 'wallet-chris', 1, 0)
  `).run();



export { db };
