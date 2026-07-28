import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { setupAuth, authMiddleware } from './auth';
import jobsRouter from './routes/jobs';
import filesRouter from './routes/files';
import './tools/dev/DummyAsync';
import './tools/network/ProxyDownloader';
import './tools/video/ExtractAudio';
import './tools/ai/TokenEstimator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
setupAuth(app);
app.use(authMiddleware);

app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));
app.use('/api/jobs', jobsRouter);
app.use('/api/files', filesRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
export default app;
