import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { saveFileRecord, enforceFileSize, getStoragePath } from '../../storage';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns/promises';
import https from 'https';

const isPrivateIP = (ip: string) => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    return false;
};

class ProxyDownloaderTool implements BackendTool {
    id = 'proxy-downloader-tool';
    mode = 'sync' as const;

    async execute(jobId: string, sessionId: string, data: { url: string }): Promise<any> {
        const { url } = data;
        if (!url || !url.startsWith('http')) throw new Error('Invalid URL. Must start with http or https.');

        try {
            const parsedUrl = new URL(url);
            let ipToConnect = parsedUrl.hostname;
            try {
                const addrs = await dns.resolve(parsedUrl.hostname);
                if (addrs.length > 0) ipToConnect = addrs[0];
            } catch (e) {}

            if (isPrivateIP(ipToConnect)) throw new Error('Access to local or private IPs is blocked.');

            // Use a custom https.Agent with a custom lookup function to prevent DNS rebinding
            // without breaking TLS SNI validation.
            const customAgent = new https.Agent({
                lookup: (hostname, options, callback) => {
                     // Always resolve to the previously checked IP to prevent rebinding
                     callback(null, ipToConnect, 4);
                }
            });

            const response = await axios({
                method: 'GET',
                url: url,
                httpsAgent: parsedUrl.protocol === 'https:' ? customAgent : undefined,
                responseType: 'stream',
                timeout: 30000
            });

            const contentLength = response.headers['content-length'] as string;
            if (contentLength) enforceFileSize(parseInt(contentLength, 10));

            const mimeType = (response.headers['content-type'] as string) || 'application/octet-stream';
            let filename = path.basename(parsedUrl.pathname) || 'downloaded_file';
            const disposition = response.headers['content-disposition'] as string;
            if (disposition && disposition.includes('filename=')) {
                const matches = /filename="([^"]+)"/.exec(disposition);
                if (matches?.[1]) filename = matches[1];
            }

            const uniqueName = `${crypto.randomBytes(8).toString('hex')}_${filename}`;
            const storagePath = getStoragePath();
            const filePath = path.join(storagePath, uniqueName);

            const writer = fs.createWriteStream(filePath);
            let totalBytes = 0;

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    totalBytes += chunk.length;
                    try { enforceFileSize(totalBytes); }
                    catch (err) {
                        response.data.destroy();
                        writer.destroy();
                        fs.unlinkSync(filePath);
                        reject(err);
                    }
                });
                response.data.pipe(writer);
                writer.on('finish', () => {
                    const recordId = saveFileRecord(sessionId, uniqueName, filename, mimeType, totalBytes, filePath);
                    resolve({ fileId: recordId, filename: filename, size: totalBytes, mimeType, url: url });
                });
                writer.on('error', (err) => reject(err));
            });
        } catch (error: any) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }
}
registry.register(new ProxyDownloaderTool());
