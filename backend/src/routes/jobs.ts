import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { registry } from '../core/ToolRegistry';
import { enqueueJob } from '../worker';
const router = Router();
router.post('/', async (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const { toolId, data } = req.body;
    const tool = registry.getTool(toolId);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    const jobId = uuidv4();
    if (tool.mode === 'sync') {
        try {
            const result = await tool.execute(jobId, sessionId, data);
            return res.json({ jobId, status: 'completed', result });
        } catch (error: any) { return res.status(500).json({ error: error.message || 'Execution failed' }); }
    } else {
        db.prepare(`INSERT INTO jobs (id, sessionId, toolId, status, progress, result) VALUES (?, ?, ?, ?, ?, ?)`).run(jobId, sessionId, toolId, 'pending', 0, JSON.stringify(data));
        enqueueJob(jobId);
        return res.status(202).json({ jobId, status: 'pending' });
    }
});
router.get('/:id', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const jobId = req.params.id;
    const job = db.prepare('SELECT id, status, progress, result, error FROM jobs WHERE id = ? AND sessionId = ?').get(jobId, sessionId) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'completed' || job.status === 'error') {
        if (job.result) try { job.result = JSON.parse(job.result); } catch (e) {}
    } else job.result = null;
    return res.json(job);
});
export default router;
