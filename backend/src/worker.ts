import { db } from './db';
import { registry } from './core/ToolRegistry';

const queue: string[] = [];
const cancelled = new Set<string>();
let isWorkerRunning = false;

export const enqueueJob = (jobId: string) => {
    queue.push(jobId);
    void processQueue();
};

const processQueue = async () => {
    if (isWorkerRunning || queue.length === 0) return;
    isWorkerRunning = true;
    try {
        while (queue.length > 0) {
            const jobId = queue.shift();
            if (!jobId) continue;
            if (cancelled.has(jobId)) {
                cancelled.delete(jobId);
                continue;
            }
            try {
                const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
                if (!job || job.status !== 'pending') continue;
                db.prepare('UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run('running', jobId);
                const tool = registry.getTool(job.toolId);
                if (!tool) throw new Error(`Tool ${job.toolId} not found`);
                const result = await tool.execute(jobId, job.sessionId, JSON.parse(job.result || '{}'));
                if (cancelled.has(jobId)) {
                    // The tool finished after a cancel request; keep the cancelled state.
                    cancelled.delete(jobId);
                    db.prepare('UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', jobId);
                } else {
                    db.prepare('UPDATE jobs SET status = ?, progress = ?, result = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
                        .run('completed', 100, JSON.stringify(result), jobId);
                }
            } catch (error: any) {
                const status = cancelled.has(jobId) ? 'cancelled' : 'error';
                cancelled.delete(jobId);
                db.prepare('UPDATE jobs SET status = ?, error = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(status, error.message || 'Unknown error', jobId);
            }
        }
    } finally {
        isWorkerRunning = false;
    }
};

/** Marks a job cancelled. Queued jobs are skipped; in-flight jobs finalize as cancelled. */
export const cancelJob = (jobId: string) => {
    cancelled.add(jobId);
    const job = db.prepare('SELECT status FROM jobs WHERE id = ?').get(jobId) as { status?: string } | undefined;
    if (job && job.status === 'pending') {
        db.prepare('UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', jobId);
        cancelled.delete(jobId);
    }
};

/** Resets a finished job back to pending and re-queues it. */
export const retryJob = (jobId: string) => {
    cancelled.delete(jobId);
    db.prepare("UPDATE jobs SET status = 'pending', progress = 0, error = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(jobId);
    enqueueJob(jobId);
};

/**
 * Called once on startup. Jobs left `pending` by a previous process are
 * re-queued, and jobs stuck in `running` (because the process died mid-job) are
 * reset to `pending` and retried instead of being lost forever.
 */
export const recoverPendingJobs = () => {
    try {
        db.prepare("UPDATE jobs SET status = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE status = 'running'").run();
        const rows = db.prepare("SELECT id FROM jobs WHERE status = 'pending' ORDER BY createdAt ASC").all() as { id: string }[];
        for (const row of rows) enqueueJob(row.id);
        if (rows.length) console.log(`Recovered ${rows.length} pending job(s) from previous session.`);
    } catch (error) {
        console.error('Failed to recover pending jobs:', error);
    }
};

export const updateJobProgress = (jobId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.floor(progress)));
    db.prepare('UPDATE jobs SET progress = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(clamped, jobId);
};