import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { updateJobProgress } from '../../worker';
import { getFileRecord, saveFileRecord, getStoragePath } from '../../storage';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class ExtractAudioTool implements BackendTool {
    id = 'extract-audio-tool';
    mode = 'async' as const;
    async execute(jobId: string, sessionId: string, data: { fileId: string, format: string }): Promise<any> {
        const { fileId, format = 'mp3' } = data;
        const record = getFileRecord(fileId, sessionId);
        if (!record) throw new Error('Input file not found or access denied.');
        const storagePath = getStoragePath();
        const outputFilename = `${crypto.randomBytes(8).toString('hex')}_audio.${format}`;
        const outputPath = path.join(storagePath, outputFilename);
        return new Promise((resolve, reject) => {
            ffmpeg(record.path)
                .output(outputPath)
                .noVideo()
                .format(format)
                .on('progress', (progress) => {
                    if (progress.percent) updateJobProgress(jobId, Math.floor(progress.percent));
                })
                .on('end', () => {
                    const stats = fs.statSync(outputPath);
                    const newFileId = saveFileRecord(sessionId, outputFilename, `extracted_audio.${format}`, `audio/${format}`, stats.size, outputPath);
                    resolve({ message: "Audio extracted successfully", fileId: newFileId, filename: `extracted_audio.${format}`, size: stats.size });
                })
                .on('error', (err) => {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    reject(new Error(`FFmpeg processing failed: ${err.message}`));
                })
                .run();
        });
    }
}
registry.register(new ExtractAudioTool());
