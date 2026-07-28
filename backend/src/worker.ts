import { db } from './db';
import { registry } from './core/ToolRegistry';
const queue: string[] = [];
let isWorkerRunning = false;
export const enqueueJob = (jobId: string) => { queue.push(jobId); processQueue(); };
const processQueue = async () => {
    if (isWorkerRunning || queue.length === 0) return;
    isWorkerRunning = true;
    while (queue.length > 0) {
        const jobId = queue.shift();
        if (!jobId) continue;
        try {
            const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
            if (!job || job.status !== 'pending') continue;
            db.prepare('UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run('running', jobId);
            const tool = registry.getTool(job.toolId);
            if (!tool) throw new Error(`Tool ${job.toolId} not found`);
            const result = await tool.execute(jobId, job.sessionId, JSON.parse(job.result || '{}'));
            db.prepare('UPDATE jobs SET status = ?, progress = ?, result = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
              .run('completed', 100, JSON.stringify(result), jobId);
        } catch (error: any) {
            db.prepare('UPDATE jobs SET status = ?, error = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
              .run('error', error.message || 'Unknown error', jobId);
        }
    }
    isWorkerRunning = false;
};
export const updateJobProgress = (jobId: string, progress: number) => {
    db.prepare('UPDATE jobs SET progress = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(progress, jobId);
};
