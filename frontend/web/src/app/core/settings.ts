const SETTINGS_KEY = "devtools:settings";

export interface AppSettings {
    theme: "dark" | "light";
    executionMode: "local" | "remote";
    maxConcurrent: number;
    serverUrl: string;
    notifications: boolean;
    autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: "dark",
    executionMode: "local",
    maxConcurrent: 2,
    serverUrl: "",
    notifications: true,
    autoUpdate: false,
};

export function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings: AppSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // ignore storage failures
    }
}

/** Applies the theme by toggling the light-theme class on <html>. */
export function applyTheme(theme: AppSettings["theme"]) {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light-theme", theme === "light");
    document.documentElement.style.colorScheme = theme;
}