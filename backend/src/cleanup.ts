import fs from 'fs';
import path from 'path';
import { db } from './db';
import { getStoragePath } from './storage';

const TOTAL_STORAGE_CAP_MB = parseInt(process.env.TOTAL_STORAGE_CAP_MB || '1024', 10);
const TOTAL_STORAGE_CAP_BYTES = TOTAL_STORAGE_CAP_MB * 1024 * 1024;

/**
 * Maps an internal error to a stable, client-safe response. Detailed messages
 * are logged server-side (with a request id) but never returned verbatim, so
 * FFmpeg output, filesystem paths and dependency internals cannot leak.
 */
export class HttpError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const VALIDATION_PATTERNS = [
    /^Invalid URL/i,
    /^Access to local or private IPs is blocked/i,
    /^Could not resolve hostname/i,
    /^File size .* exceeds/i,
    /^No file uploaded/i,
    /^Input file not found/i,
    /^No video file selected/i,
    /^Invalid storage filename/i,
    /^Refusing to write outside/i,
    /^Unsupported/,
    /^No text provided/i,
    /^text is required/i,
    /^Missing|is required/i,
    /^Unknown tool/i,
];

export const publicError = (err: unknown): { status: number; code: string; message: string } => {
    if (err instanceof HttpError) {
        return { status: err.status, code: err.code, message: err.message };
    }
    const message = err instanceof Error ? err.message : '';
    if (VALIDATION_PATTERNS.some((pattern) => pattern.test(message))) {
        return { status: 400, code: 'bad_request', message };
    }
    if (/not found/i.test(message)) {
        return { status: 404, code: 'not_found', message };
    }
    return { status: 500, code: 'internal_error', message: 'The operation failed. Check server logs for details.' };
};

/**
 * Reconciles storage in both directions:
 *  - removes files on disk with no database record (orphans)
 *  - removes database records whose file no longer exists (dangling rows)
 */
export const cleanupOrphanedFiles = async () => {
    const storagePath = getStoragePath();
    let filesOnDisk: string[] = [];
    try {
        filesOnDisk = await fs.promises.readdir(storagePath);
    } catch {
        return;
    }

    const rows = db.prepare('SELECT id, filename FROM files').all() as { id: string; filename: string }[];
    const validFilenames = new Set(rows.map((f) => f.filename));

    for (const file of filesOnDisk) {
        if (!validFilenames.has(file)) {
            try {
                await fs.promises.unlink(path.join(storagePath, file));
            } catch {
                // best effort
            }
        }
    }

    for (const row of rows) {
        try {
            await fs.promises.access(path.join(storagePath, row.filename));
        } catch {
            db.prepare('DELETE FROM files WHERE id = ?').run(row.id);
        }
    }
};

/**
 * Evicts the oldest files until total tracked storage is under the configured
 * cap. Uses async unlink so the event loop is not blocked.
 */
export const enforceTotalStorageCap = async () => {
    const storagePath = getStoragePath();
    const allFiles = db.prepare('SELECT id, filename, size FROM files ORDER BY createdAt ASC').all() as { id: string; filename: string; size: number }[];
    let totalSize = allFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    if (totalSize <= TOTAL_STORAGE_CAP_BYTES) return;

    for (const file of allFiles) {
        if (totalSize <= TOTAL_STORAGE_CAP_BYTES) break;
        try {
            await fs.promises.unlink(path.join(storagePath, file.filename));
        } catch {
            // file may already be gone
        }
        db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
        totalSize -= file.size;
    }
};

export const runCleanupJob = async () => {
    await cleanupOrphanedFiles();
    await enforceTotalStorageCap();
};