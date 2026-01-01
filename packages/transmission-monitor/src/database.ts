import Database, { type Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ?? "./data";
const DB_PATH = path.join(DATA_DIR, "snapshots.db");

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

const db: DatabaseType = new Database(DB_PATH, { timeout: DB_TIMEOUT_MS });

// Enable WAL mode for better concurrent read/write performance
db.pragma("journal_mode = WAL");

// Create table for snapshots
// upload/download can be NULL when Transmission is unavailable
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    upload INTEGER,
    download INTEGER,
    details TEXT NOT NULL
  )
`);

// Create index on timestamp for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON snapshots(timestamp)
`);

export interface PeerInfo {
  ip: string;
  port: number;
  country: string | null;
  client: string;
  downloadSpeed: number;
  uploadSpeed: number;
  isSeeder: boolean;
  isDownloading: boolean;
  isUploading: boolean;
}

export interface TorrentDetail {
  torrent: string;
  torrent_id: number;
  upload: number;
  download: number;
  peers: PeerInfo[];
}

export interface Snapshot {
  id?: number;
  timestamp: number;
  upload: number | null;
  download: number | null;
  details: TorrentDetail[];
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const insertSnapshot = db.prepare(`
  INSERT INTO snapshots (timestamp, upload, download, details)
  VALUES (@timestamp, @upload, @download, @details)
`);

const getSnapshotsSince = db.prepare(`
  SELECT id, timestamp, upload, download, details
  FROM snapshots
  WHERE timestamp >= ?
  ORDER BY timestamp ASC
`);

const getSnapshotsInRange = db.prepare(`
  SELECT id, timestamp, upload, download, details
  FROM snapshots
  WHERE timestamp >= ? AND timestamp <= ?
  ORDER BY timestamp ASC
`);

const deleteOldSnapshots = db.prepare(`
  DELETE FROM snapshots WHERE timestamp < ?
`);

export const saveSnapshot = (snapshot: Omit<Snapshot, "id">): void => {
  try {
    insertSnapshot.run({
      timestamp: snapshot.timestamp,
      upload: snapshot.upload,
      download: snapshot.download,
      details: JSON.stringify(snapshot.details),
    });
  } catch (error) {
    console.error("[Database] Failed to save snapshot:", error);
  }
};

export const getSnapshots = (seconds: number): Snapshot[] => {
  try {
    const since = Date.now() - seconds * 1000;
    const rows = getSnapshotsSince.all(since) as {
      id: number;
      timestamp: number;
      upload: number;
      download: number;
      details: string;
    }[];

    return rows.map((row) => ({
      ...row,
      details: JSON.parse(row.details),
    }));
  } catch (error) {
    console.error("[Database] Failed to get snapshots:", error);
    return [];
  }
};

export const getSnapshotsByRange = (from: number, to: number): Snapshot[] => {
  try {
    const rows = getSnapshotsInRange.all(from, to) as {
      id: number;
      timestamp: number;
      upload: number;
      download: number;
      details: string;
    }[];

    return rows.map((row) => ({
      ...row,
      details: JSON.parse(row.details),
    }));
  } catch (error) {
    console.error("[Database] Failed to get snapshots by range:", error);
    return [];
  }
};

export const cleanupOldSnapshots = (): number => {
  try {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    const result = deleteOldSnapshots.run(cutoff);
    return result.changes;
  } catch (error) {
    console.error("[Database] Failed to cleanup old snapshots:", error);
    return 0;
  }
};

export default db;
