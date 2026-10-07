import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getStoragePath } from '../storage';

const router = Router();

/**
 * Lightweight, real server/runtime statistics for the dashboard. Values are
 * derived from the live process and database rather than hardcoded.
 */
router.get('/', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;

    const counts = db.prepare(`
        SELECT
            SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS failed,
            COUNT(*) AS total
        FROM jobs WHERE sessionId = ?
    `).get(sessionId) as any;

    const storage = db.prepare('SELECT COUNT(*) AS files, COALESCE(SUM(size), 0) AS bytes FROM files WHERE sessionId = ?').get(sessionId) as any;

    const mem = process.memoryUsage();
    const load = (() => {
        try { return require('os').loadavg()[0] as number; } catch { return 0; }
    })();

    return res.json({
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid,
        loadAverage1m: load,
        memory: {
            rssBytes: mem.rss,
            heapUsedBytes: mem.heapUsed,
            heapTotalBytes: mem.heapTotal,
        },
        jobs: {
            running: counts?.running ?? 0,
            pending: counts?.pending ?? 0,
            completed: counts?.completed ?? 0,
            failed: counts?.failed ?? 0,
            total: counts?.total ?? 0,
        },
        storage: {
            path: getStoragePath(),
            files: storage?.files ?? 0,
            bytes: storage?.bytes ?? 0,
        },
    });
});

export default router;