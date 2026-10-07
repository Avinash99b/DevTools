import { open } from 'fs/promises';

const ascii = (buf: Buffer, start: number, len: number) => buf.toString('latin1', start, start + len);

/**
 * Lightweight media signature check. Uploaded files are later parsed by FFmpeg,
 * so we refuse anything whose leading bytes are not a known audio/video
 * container, regardless of the client-declared Content-Type.
 */
export function hasMediaSignature(buf: Buffer): boolean {
    if (buf.length < 4) return false;

    // ISO Base Media (mp4 / mov / m4a / m4v / 3gp): "....ftyp"
    if (ascii(buf, 4, 4) === 'ftyp') return true;
    // Matroska / WebM (EBML header)
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return true;
    // RIFF containers: AVI and WAV
    if (ascii(buf, 0, 4) === 'RIFF' && (ascii(buf, 8, 4) === 'AVI ' || ascii(buf, 8, 4) === 'WAVE')) return true;
    // Ogg and FLAC
    if (ascii(buf, 0, 4) === 'OggS' || ascii(buf, 0, 4) === 'fLaC') return true;
    // MP3 with ID3 tag
    if (ascii(buf, 0, 3) === 'ID3') return true;
    // MPEG audio/video frame sync (0xFF Ex / 0xFF Fx)
    if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
    // MPEG program/transport stream or video elementary stream
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && (buf[3] === 0xba || buf[3] === 0xb3)) return true;

    return false;
}

/** Reads the first 16 bytes of a file and validates its media signature. */
export async function fileHasMediaSignature(filePath: string): Promise<boolean> {
    const handle = await open(filePath, 'r');
    try {
        const buf = Buffer.alloc(16);
        const { bytesRead } = await handle.read(buf, 0, 16, 0);
        return hasMediaSignature(buf.subarray(0, bytesRead));
    } finally {
        await handle.close();
    }
}