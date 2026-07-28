import fs from 'fs';
import path from 'path';
import { db } from './db';
import { getStoragePath } from './storage';

const TOTAL_STORAGE_CAP_MB = parseInt(process.env.TOTAL_STORAGE_CAP_MB || '1024', 10);
const TOTAL_STORAGE_CAP_BYTES = TOTAL_STORAGE_CAP_MB * 1024 * 1024;

export const cleanupOrphanedFiles = () => {
    const storagePath = getStoragePath();
    const filesOnDisk = fs.readdirSync(storagePath);
    const stmt = db.prepare('SELECT id, filename FROM files');
    const validFiles = stmt.all() as {id: string, filename: string}[];
    const validFilenames = new Set(validFiles.map(f => f.filename));

    for (const file of filesOnDisk) {
        if (!validFilenames.has(file)) {
            try { fs.unlinkSync(path.join(storagePath, file)); } catch (err) {}
        }
    }
};

export const enforceTotalStorageCap = () => {
    const storagePath = getStoragePath();
    const stmt = db.prepare('SELECT id, filename, size FROM files ORDER BY createdAt ASC');
    const allFiles = stmt.all() as {id: string, filename: string, size: number}[];
    let totalSize = allFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    if (totalSize > TOTAL_STORAGE_CAP_BYTES) {
        let index = 0;
        while (totalSize > TOTAL_STORAGE_CAP_BYTES && index < allFiles.length) {
            const file = allFiles[index];
            const filePath = path.join(storagePath, file.filename);
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
                totalSize -= file.size;
            } catch (err) {}
            index++;
        }
    }
};
export const runCleanupJob = () => { cleanupOrphanedFiles(); enforceTotalStorageCap(); };
