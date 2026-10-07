import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/devtools.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);

db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        toolId TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        result TEXT,
        error TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        filename TEXT NOT NULL,
        originalName TEXT,
        mimeType TEXT,
        size INTEGER,
        path TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions (expiresAt);
    CREATE INDEX IF NOT EXISTS idx_jobs_sessionId ON jobs (sessionId);
    CREATE INDEX IF NOT EXISTS idx_files_sessionId ON files (sessionId);
`);
