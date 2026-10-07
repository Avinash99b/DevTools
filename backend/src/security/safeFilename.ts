import path from 'path';

/**
 * Produces a safe, human readable filename for display and download. Remote
 * servers and clients must never be able to influence the on-disk path, so this
 * only ever returns a basename with separators and control characters removed.
 */
export function sanitizeDisplayName(name: unknown, fallback = 'download'): string {
    if (typeof name !== 'string') return fallback;
    // Keep only the final path segment regardless of separator style.
    const base = name.split(/[\\/]/).pop() ?? '';
    // Remove NUL bytes and control characters, then trim surrounding dots/spaces.
    const cleaned = base
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/^[.\s]+|[.\s]+$/g, '');
    if (!cleaned) return fallback;
    return cleaned.slice(0, 180);
}

/**
 * Returns a lowercase file extension (including the leading dot) or an empty
 * string when the name has no usable extension.
 */
export function safeExtension(name: string): string {
    const ext = path.extname(sanitizeDisplayName(name));
    return /^\.[a-z0-9]{1,10}$/i.test(ext) ? ext.toLowerCase() : '';
}

/**
 * Joins a generated filename onto the storage directory and asserts the result
 * stays inside it. Throws instead of silently escaping via traversal.
 */
export function resolveStoragePath(storagePath: string, filename: string): string {
    if (filename !== path.basename(filename)) {
        throw new Error('Invalid storage filename.');
    }
    const resolved = path.resolve(storagePath, filename);
    const root = path.resolve(storagePath) + path.sep;
    if (!resolved.startsWith(root)) {
        throw new Error('Refusing to write outside the storage directory.');
    }
    return resolved;
}