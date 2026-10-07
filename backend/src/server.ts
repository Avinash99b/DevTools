import './env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setupAuth, authMiddleware } from './auth';
import jobsRouter from './routes/jobs';
import filesRouter from './routes/files';
import statsRouter from './routes/stats';
import { publicError, runCleanupJob } from './cleanup';
import { recoverPendingJobs } from './worker';
import './tools/dev/DummyAsync';
import './tools/network/ProxyDownloader';
import './tools/video/ExtractAudio';
import './tools/ai/TokenEstimator';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
setupAuth(app);

// Public health check must come before auth so uptime probes work.
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));

app.use(authMiddleware);
app.use('/api/jobs', jobsRouter);
app.use('/api/files', filesRouter);
app.use('/api/stats', statsRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const mapped = publicError(err);
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ->`, err);
    if (res.headersSent) return next(err);
    res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
});

if (require.main === module) {
    recoverPendingJobs();
    // Periodic storage reconciliation (orphans, dangling rows, cap eviction).
    setInterval(() => { void runCleanupJob(); }, 15 * 60 * 1000);
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
export default app;