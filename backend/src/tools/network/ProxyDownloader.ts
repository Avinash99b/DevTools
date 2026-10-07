import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { saveFileRecord, enforceFileSize, getStoragePath } from '../../storage';
import { isBlockedIp, resolvePublicHost, makeSafeLookup } from '../../security/safeNet';
import { sanitizeDisplayName, safeExtension, resolveStoragePath } from '../../security/safeFilename';
import axios from 'axios';
import fs from 'fs';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { Readable } from 'stream';

const MAX_REDIRECTS = 5;
const MAX_BYTES = 100 * 1024 * 1024; // hard ceiling independent of env config

const buildAgent = (url: URL, validated: { address: string; family: 4 | 6 }[]) => {
    const lookup = makeSafeLookup(validated);
    return url.protocol === 'https:' ? new https.Agent({ lookup }) : new http.Agent({ lookup });
};

const requestOnce = async (urlString: string) => {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid URL. Only http and https are allowed.');
    }
    if (parsed.username || parsed.password) {
        throw new Error('Invalid URL. Credentials in URLs are not allowed.');
    }
    // Reject literal private/loopback hosts before any DNS work.
    if (isBlockedIp(parsed.hostname)) {
        throw new Error('Access to local or private IPs is blocked.');
    }

    const validated = await resolvePublicHost(parsed.hostname);
    const agent = buildAgent(parsed, validated);

    return axios({
        method: 'GET',
        url: urlString,
        httpAgent: agent,
        httpsAgent: agent,
        responseType: 'stream',
        timeout: 30000,
        maxRedirects: 0,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        validateStatus: (status) => status >= 200 && status < 400,
    });
};

/** Follows redirects manually, revalidating every hop against the SSRF rules. */
const fetchWithSafeRedirects = async (startUrl: string) => {
    let current = startUrl;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const response = await requestOnce(current);
        const status = response.status;
        if (status >= 300 && status < 400) {
            const location = response.headers['location'] as string | undefined;
            if (!location) throw new Error('Redirect response missing Location header.');
            // Release the redirect body stream before following.
            (response.data as Readable)?.destroy?.();
            current = new URL(location, current).toString();
            continue;
        }
        return response;
    }
    throw new Error('Too many redirects.');
};

const downloadToFile = (source: Readable, filePath: string, maxSize: number) =>
    new Promise<number>((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        let total = 0;
        let settled = false;
        const fail = (err: Error) => {
            if (settled) return;
            settled = true;
            source.destroy();
            writer.destroy();
            fs.promises.unlink(filePath).catch(() => {});
            reject(err);
        };
        source.on('data', (chunk: Buffer) => {
            total += chunk.length;
            try {
                enforceFileSize(total);
                if (total > MAX_BYTES) throw new Error('File size exceeds the maximum allowed size.');
            } catch (err: any) {
                fail(err);
            }
        });
        source.on('error', fail);
        source.on('aborted', () => fail(new Error('Download aborted by the remote server.')));
        writer.on('error', fail);
        writer.on('finish', () => {
            if (settled) return;
            settled = true;
            resolve(total);
        });
        source.pipe(writer);
    });

class ProxyDownloaderTool implements BackendTool {
    id = 'proxy-downloader-tool';
    mode = 'sync' as const;

    async execute(jobId: string, sessionId: string, data: { url: string }): Promise<any> {
        const { url } = data ?? {};
        if (typeof url !== 'string' || !url.trim()) throw new Error('Invalid URL. Must start with http or https.');

        const response = await fetchWithSafeRedirects(url.trim());

        const contentLength = response.headers['content-length'] as string | undefined;
        if (contentLength) enforceFileSize(parseInt(contentLength, 10));

        const mimeType = ((response.headers['content-type'] as string) || 'application/octet-stream').split(';')[0].trim();

        // Remote-provided names are used only for display; the on-disk name is
        // always generated locally so path traversal is impossible.
        const parsedFinal = new URL(response.request?.res?.responseUrl || url);
        const disposition = response.headers['content-disposition'] as string | undefined;
        let remoteName = parsedFinal.pathname.split('/').pop() || 'downloaded_file';
        if (disposition) {
            const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
            if (match?.[1]) remoteName = decodeURIComponent(match[1].replace(/"/g, ''));
        }
        const displayName = sanitizeDisplayName(remoteName, 'downloaded_file');
        const ext = safeExtension(displayName);

        const storagePath = getStoragePath();
        const storedName = `${crypto.randomBytes(8).toString('hex')}${ext}`;
        const finalPath = resolveStoragePath(storagePath, storedName);
        const tempPath = resolveStoragePath(storagePath, `${storedName}.part`);

        const totalBytes = await downloadToFile(response.data as Readable, tempPath, MAX_BYTES);

        await fs.promises.rename(tempPath, finalPath);

        let recordId: string;
        try {
            recordId = saveFileRecord(sessionId, storedName, displayName, mimeType, totalBytes, finalPath);
        } catch (err) {
            // Keep disk and DB consistent if the record insert fails.
            await fs.promises.unlink(finalPath).catch(() => {});
            throw err;
        }

        return { fileId: recordId, filename: displayName, size: totalBytes, mimeType, url };
    }
}

registry.register(new ProxyDownloaderTool());