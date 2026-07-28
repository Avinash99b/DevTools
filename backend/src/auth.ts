import { Express, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const setupAuth = (app: Express) => {
    app.post('/api/login', (req: Request, res: Response) => {
        const { secret } = req.body;
        const accessSecret = process.env.ACCESS_SECRET;

        if (!accessSecret) {
             return res.status(500).json({ error: 'ACCESS_SECRET not configured on server' });
        }

        if (secret === accessSecret) {
            const sessionId = uuidv4();
            res.cookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return res.json({ success: true });
        }
        return res.status(401).json({ error: 'Invalid secret' });
    });
    app.post('/api/logout', (req: Request, res: Response) => {
        res.clearCookie('sessionId');
        return res.json({ success: true });
    });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const accessSecret = process.env.ACCESS_SECRET;
    if (!accessSecret) return res.status(500).json({ error: 'Server misconfigured' });
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });
    (req as any).sessionId = sessionId;
    next();
};
