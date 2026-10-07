import dns from 'dns/promises';
import net from 'net';
import ipaddr from 'ipaddr.js';

/**
 * Ranges that must never be reachable from a user-supplied outbound URL.
 * `ipaddr.js` `.range()` returns one of these strings for any parsed address.
 */
const BLOCKED_RANGES = new Set([
    'unspecified',
    'broadcast',
    'multicast',
    'linkLocal',
    'loopback',
    'private',
    'reserved',
    'carrierGradeNat',
    'uniqueLocal',
    'ipv4Mapped',
    'rfc6145',
    'rfc6052',
    '6to4',
    'teredo',
    'benchmarking',
    'amt',
    'as112',
    'as112v6',
    'orchid2',
]);

/**
 * Returns true when an IP literal points at a private, loopback, link-local,
 * multicast, reserved or otherwise non-public destination.
 *
 * All IP families are handled through `ipaddr.js` so IPv6, IPv4-mapped IPv6 and
 * the full set of special-use ranges are covered (not just a few IPv4 prefixes).
 */
export function isBlockedIp(rawIp: string): boolean {
    let ip = rawIp.trim();
    // Strip an IPv6 zone id (e.g. fe80::1%eth0)
    const zoneIndex = ip.indexOf('%');
    if (zoneIndex !== -1) ip = ip.slice(0, zoneIndex);
    // url.hostname keeps IPv6 addresses wrapped in brackets
    if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);

    if (!ipaddr.isValid(ip)) return true; // fail closed on anything unparseable
    let addr = ipaddr.parse(ip);

    // Normalise IPv4-mapped / 6to4 / teredo wrappers to the embedded IPv4 so the
    // private ranges of the inner address are evaluated too.
    if (addr.kind() === 'ipv6') {
        const v6 = addr as ipaddr.IPv6;
        if (v6.isIPv4MappedAddress()) {
            addr = v6.toIPv4Address();
        }
    }

    return BLOCKED_RANGES.has(addr.range());
}

/**
 * Resolves a hostname to every A/AAAA record and rejects if *any* of the
 * returned addresses is private. Returns the full list of validated addresses so
 * DNS rebinding between the check and the actual connection cannot occur.
 */
export async function resolvePublicHost(hostname: string): Promise<{ address: string; family: 4 | 6 }[]> {
    if (isBlockedIp(hostname)) {
        throw new Error('Access to local or private IPs is blocked.');
    }

    let records: { address: string; family: number }[];
    try {
        records = await dns.lookup(hostname, { all: true });
    } catch {
        throw new Error('Could not resolve hostname.');
    }

    if (!records.length) throw new Error('Could not resolve hostname.');

    for (const record of records) {
        if (isBlockedIp(record.address)) {
            throw new Error('Access to local or private IPs is blocked.');
        }
    }

    return records.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
}

/**
 * Builds a bump-free `lookup` implementation for net sockets. It only ever
 * returns the exact addresses validated by {@link resolvePublicHost}, so a
 * second DNS answer cannot redirect the connection to an internal host.
 */
export function makeSafeLookup(validated: { address: string; family: 4 | 6 }[]) {
    return (
        _hostname: string,
        _options: any,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
    ) => {
        const first = validated[0];
        if (!first) {
            callback(new Error('No validated address available.'), '', 0);
            return;
        }
        callback(null, first.address, first.family);
    };
}

/**
 * Creates an IP-literal-only hostname for a net connect call. Not currently
 * used but exported for completeness when building agents without lookup hooks.
 */
export function toSocketHost(addr: { address: string; family: 4 | 6 }): string {
    return net.isIPv6(addr.address) ? `[${addr.address}]` : addr.address;
}