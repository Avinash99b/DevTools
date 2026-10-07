import { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createSession, deleteSession, getSession, sessionCookieOptions, purgeExpiredSessions } from './sessionStore';

const compareSecret = (provided: string, expected: string) => {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

/**
 * Simple in-memory rate limiter for the login endpoint. Disk/DB state is not
 * required for this single-process prototype; the goal is only to stop trivial
 * online brute forcing of the shared secret.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = parseInt(process.env.LOGIN_WINDOW_MS || '60000', 10);
const LOGIN_MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '10', 10);

const isRateLimited = (key: string) => {
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (!entry || entry.resetAt <= now) {
        loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
        return false;
    }
    entry.count += 1;
    return entry.count > LOGIN_MAX_ATTEMPTS;
};

export const setupAuth = (app: Express) => {
    app.post('/api/login', (req: Request, res: Response) => {
        const accessSecret = process.env.ACCESS_SECRET;
        if (!accessSecret) {
            return res.status(500).json({ error: 'ACCESS_SECRET not configured on server' });
        }

        const key = req.ip || 'unknown';
        if (isRateLimited(key)) {
            return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
        }

        const { secret } = req.body ?? {};
        if (typeof secret !== 'string' || !compareSecret(secret, accessSecret)) {
            return res.status(401).json({ error: 'Invalid secret' });
        }

        purgeExpiredSessions();
        const sessionId = createSession();
        res.cookie('sessionId', sessionId, sessionCookieOptions());
        return res.json({ success: true });
    });

    app.post('/api/logout', (req: Request, res: Response) => {
        const sessionId = req.cookies?.sessionId;
        if (typeof sessionId === 'string') deleteSession(sessionId);
        res.clearCookie('sessionId', { path: '/' });
        return res.json({ success: true });
    });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const accessSecret = process.env.ACCESS_SECRET;
    if (!accessSecret) return res.status(500).json({ error: 'Server misconfigured' });

    const sessionId = req.cookies?.sessionId;
    const session = getSession(typeof sessionId === 'string' ? sessionId : undefined);
    if (!session) {
        res.clearCookie('sessionId', { path: '/' });
        return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).sessionId = session.id;
    next();
};