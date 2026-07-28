import fs from 'fs';
import path from 'path';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, '../../data/storage');
const MAX_FILE_SIZE = parseInt(process.env.PERSISTENT_FILE_SIZE_MAX || '10485760', 10);

if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

export const getStoragePath = () => STORAGE_PATH;

export const saveFileRecord = (sessionId: string, filename: string, originalName: string, mimeType: string, size: number, filePath: string) => {
    const id = uuidv4();
    const stmt = db.prepare(`
        INSERT INTO files (id, sessionId, filename, originalName, mimeType, size, path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionId, filename, originalName, mimeType, size, filePath);
    return id;
};

export const getFileRecord = (id: string, sessionId: string) => {
    const stmt = db.prepare('SELECT * FROM files WHERE id = ? AND sessionId = ?');
    return stmt.get(id, sessionId) as any;
};

export const enforceFileSize = (size: number) => {
    if (size > MAX_FILE_SIZE) {
        throw new Error(`File size ${size} exceeds the maximum allowed size of ${MAX_FILE_SIZE} bytes.`);
    }
};
