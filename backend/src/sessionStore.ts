import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || String(24 * 60 * 60 * 1000), 10);

export interface SessionRow {
    id: string;
    createdAt: number;
    expiresAt: number;
}

/**
 * Server-side session registry. A random cookie value is only considered valid
 * if a matching, unexpired row exists here. This prevents callers from forging
 * `sessionId` cookies to gain access.
 */
export const createSession = (): string => {
    const id = uuidv4();
    const now = Date.now();
    db.prepare('INSERT INTO sessions (id, createdAt, expiresAt) VALUES (?, ?, ?)').run(id, now, now + SESSION_TTL_MS);
    return id;
};

export const getSession = (id: string | undefined): SessionRow | undefined => {
    if (!id || typeof id !== 'string') return undefined;
    const row = db.prepare('SELECT id, createdAt, expiresAt FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
    if (!row) return undefined;
    if (row.expiresAt <= Date.now()) {
        deleteSession(id);
        return undefined;
    }
    return row;
};

export const deleteSession = (id: string) => {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
};

export const purgeExpiredSessions = () => {
    db.prepare('DELETE FROM sessions WHERE expiresAt <= ?').run(Date.now());
};

export const sessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS,
});