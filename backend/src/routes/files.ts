import { Router, Request, Response } from 'express';
import { getFileRecord, saveFileRecord, getStoragePath, getMaxFileSize, enforceFileSize } from '../storage';
import { resolveStoragePath, sanitizeDisplayName, safeExtension } from '../security/safeFilename';
import { fileHasMediaSignature } from '../security/mediaSignature';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

const router = Router();

const upload = multer({
    dest: getStoragePath(),
    limits: {
        fileSize: getMaxFileSize(),
        files: 1,
    },
});

// Accepted upload signatures per declared MIME family. Uploaded media is later
// handed to FFmpeg, so we gate on magic bytes rather than trusting the client.
const ALLOWED_UPLOAD_MIME = new Set([
    'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm',
    'video/x-msvideo', 'video/mpeg', 'video/x-m4v', 'video/ogg',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm',
]);

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
        enforceFileSize(file.size);
        if (file.mimetype && !ALLOWED_UPLOAD_MIME.has(file.mimetype)) {
            throw new Error('Unsupported file type for server-side processing.');
        }
        // Content sniffing: the declared Content-Type is attacker controlled, so
        // verify the actual leading bytes are a known media container.
        if (!(await fileHasMediaSignature(file.path))) {
            throw new Error('Unsupported file type for server-side processing.');
        }

        const originalName = sanitizeDisplayName(file.originalname, 'upload');
        const ext = safeExtension(originalName);
        const filename = `${crypto.randomBytes(8).toString('hex')}${ext}`;
        const newPath = resolveStoragePath(getStoragePath(), filename);

        // Multer already wrote the file to a temp path; move it into place.
        await fs.promises.rename(file.path, newPath);

        let recordId: string;
        try {
            recordId = saveFileRecord(sessionId, filename, originalName, file.mimetype, file.size, newPath);
        } catch (err) {
            await fs.promises.unlink(newPath).catch(() => {});
            throw err;
        }

        return res.json({ success: true, fileId: recordId });
    } catch (err: any) {
        if (file?.path) await fs.promises.unlink(file.path).catch(() => {});
        const status = /exceeds the maximum/i.test(err.message) ? 413 : 400;
        return res.status(status).json({ error: err.message || 'Upload failed.' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const fileId = req.params.id as string;
    const record = getFileRecord(fileId, sessionId);
    if (!record) return res.status(404).json({ error: 'File not found or access denied.' });
    try {
        await fs.promises.access(record.path);
    } catch {
        return res.status(404).json({ error: 'File no longer available.' });
    }
    res.download(record.path, record.originalName);
});

// Surface Multer's own errors (e.g. LIMIT_FILE_SIZE) as clean JSON responses.
router.use((err: any, req: Request, res: Response, next: any) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `File exceeds the maximum allowed size of ${getMaxFileSize()} bytes.` });
    }
    if (err) return res.status(400).json({ error: 'Upload failed.' });
    return next();
});

export default router;