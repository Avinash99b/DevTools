import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { registry } from '../core/ToolRegistry';
import { enqueueJob, cancelJob, retryJob } from '../worker';
import { publicError } from '../cleanup';

const router = Router();

const parseResult = (job: any) => {
    if (job.status === 'completed' && job.result) {
        try { job.result = JSON.parse(job.result); } catch { /* leave as-is */ }
    } else {
        // Never echo request payloads back for pending/running/error jobs.
        job.result = null;
    }
    return job;
};

router.post('/', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const { toolId, data } = req.body ?? {};
        if (typeof toolId !== 'string' || !toolId) {
            return res.status(400).json({ error: 'toolId is required.' });
        }
        if (data !== undefined && (typeof data !== 'object' || data === null || Array.isArray(data))) {
            return res.status(400).json({ error: 'data must be an object.' });
        }
        const tool = registry.getTool(toolId);
        if (!tool) return res.status(404).json({ error: 'Unknown tool.' });

        const jobId = uuidv4();
        if (tool.mode === 'sync') {
            try {
                const result = await tool.execute(jobId, sessionId, data ?? {});
                return res.json({ jobId, status: 'completed', result });
            } catch (error: any) {
                const mapped = publicError(error);
                console.error(`[job ${jobId}] sync execution failed:`, error);
                return res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
            }
        }

        db.prepare('INSERT INTO jobs (id, sessionId, toolId, status, progress, result) VALUES (?, ?, ?, ?, ?, ?)')
            .run(jobId, sessionId, toolId, 'pending', 0, JSON.stringify(data ?? {}));
        enqueueJob(jobId);
        return res.status(202).json({ jobId, status: 'pending' });
    } catch (error) {
        const mapped = publicError(error);
        console.error('Failed to create job:', error);
        return res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
});

/** Recent jobs for the current session, newest first. */
router.get('/', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const jobs = db
        .prepare('SELECT id, toolId, status, progress, result, error, createdAt, updatedAt FROM jobs WHERE sessionId = ? ORDER BY createdAt DESC LIMIT ?')
        .all(sessionId, limit) as any[];
    return res.json({ jobs: jobs.map(parseResult) });
});

router.get('/:id', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const jobId = req.params.id;
    const job = db.prepare('SELECT id, toolId, status, progress, result, error, createdAt, updatedAt FROM jobs WHERE id = ? AND sessionId = ?').get(jobId, sessionId) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json(parseResult(job));
});

/** Cancel a pending or running job. */
router.delete('/:id', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const jobId = req.params.id as string;
    const job = db.prepare('SELECT id, status FROM jobs WHERE id = ? AND sessionId = ?').get(jobId, sessionId) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
        return res.status(409).json({ error: 'Job already finished.' });
    }
    cancelJob(jobId);
    return res.json({ success: true, status: 'cancelled' });
});

/** Re-queue a failed or cancelled job. */
router.post('/:id/retry', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const jobId = req.params.id as string;
    const job = db.prepare('SELECT id, status FROM jobs WHERE id = ? AND sessionId = ?').get(jobId, sessionId) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'error' && job.status !== 'cancelled') {
        return res.status(409).json({ error: 'Only failed or cancelled jobs can be retried.' });
    }
    retryJob(jobId);
    return res.json({ success: true, status: 'pending' });
});

export default router;