import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { updateJobProgress } from '../../worker';
import { getFileRecord, saveFileRecord, getStoragePath } from '../../storage';
import { resolveStoragePath } from '../../security/safeFilename';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/** Explicit allowlist prevents arbitrary values reaching the output path or FFmpeg. */
const ALLOWED_FORMATS: Record<string, { container: string; mime: string }> = {
    mp3: { container: 'mp3', mime: 'audio/mpeg' },
    aac: { container: 'adts', mime: 'audio/aac' },
    wav: { container: 'wav', mime: 'audio/wav' },
};

class ExtractAudioTool implements BackendTool {
    id = 'extract-audio-tool';
    mode = 'async' as const;

    async execute(jobId: string, sessionId: string, data: { fileId: string; format?: string }): Promise<any> {
        const { fileId } = data ?? {};
        const requested = String(data?.format ?? 'mp3').toLowerCase();
        const format = ALLOWED_FORMATS[requested];
        if (!format) throw new Error(`Unsupported output format. Allowed: ${Object.keys(ALLOWED_FORMATS).join(', ')}`);
        if (!fileId || typeof fileId !== 'string') throw new Error('Input fileId is required.');

        const record = getFileRecord(fileId, sessionId);
        if (!record) throw new Error('Input file not found or access denied.');

        const storagePath = getStoragePath();
        const outputFilename = `${crypto.randomBytes(8).toString('hex')}_audio.${requested}`;
        const outputPath = resolveStoragePath(storagePath, outputFilename);

        return new Promise((resolve, reject) => {
            const cleanupOutput = () => {
                fs.promises.unlink(outputPath).catch(() => {});
            };
            ffmpeg(record.path)
                .output(outputPath)
                .noVideo()
                .format(format.container)
                .on('progress', (progress) => {
                    if (progress.percent) updateJobProgress(jobId, Math.floor(progress.percent));
                })
                .on('end', async () => {
                    try {
                        const stats = await fs.promises.stat(outputPath);
                        const newFileId = saveFileRecord(
                            sessionId,
                            outputFilename,
                            `extracted_audio.${requested}`,
                            format.mime,
                            stats.size,
                            outputPath
                        );
                        resolve({ message: 'Audio extracted successfully', fileId: newFileId, filename: `extracted_audio.${requested}`, size: stats.size, mimeType: format.mime });
                    } catch (err: any) {
                        // Never leave an untracked file behind on a DB failure.
                        cleanupOutput();
                        reject(new Error(`Failed to finalize extracted audio: ${err.message}`));
                    }
                })
                .on('error', (err) => {
                    cleanupOutput();
                    reject(new Error(`FFmpeg processing failed: ${err.message}`));
                })
                .run();
        });
    }
}

registry.register(new ExtractAudioTool());