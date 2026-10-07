const RECENT_KEY = "devtools:recent-tools";
const MAX = 8;

/** Records that a tool was opened so HomePage can show genuine recents. */
export function markToolUsed(toolId: string) {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const next = [toolId, ...ids.filter((id) => id !== toolId)].slice(0, MAX);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // Ignore storage failures (private mode, quota) — recents are best effort.
    }
}