import { Router, Request, Response } from 'express';
import { getFileRecord, saveFileRecord, getStoragePath } from '../storage';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
const router = Router();
const upload = multer({ dest: getStoragePath() });
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const filename = `${crypto.randomBytes(8).toString('hex')}${ext}`;
    const newPath = path.join(getStoragePath(), filename);
    const fs = require('fs');
    fs.renameSync(file.path, newPath);
    const recordId = saveFileRecord(sessionId, filename, originalName, file.mimetype, file.size, newPath);
    res.json({ success: true, fileId: recordId });
});
router.get('/:id', (req: Request, res: Response) => {
    const sessionId = (req as any).sessionId;
    const fileId = req.params.id as string;
    const record = getFileRecord(fileId, sessionId);
    if (!record) return res.status(404).json({ error: 'File not found or access denied.' });
    res.download(record.path, record.originalName);
});
export default router;
