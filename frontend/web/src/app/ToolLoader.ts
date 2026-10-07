import devToolManager from "./core/DevToolManager";

export interface ToolLoadResult {
    total: number;
    failed: string[];
}

/**
 * Loads every tool module. Failures are isolated per-module: one broken tool
 * must not prevent the rest of the platform (or the app) from starting.
 */
export async function loadTools(): Promise<ToolLoadResult> {
    const modules = import.meta.glob("./tools/**/*.tsx");
    const entries = Object.entries(modules);
    const failed: string[] = [];

    await Promise.all(entries.map(async ([path, loader]) => {
        try {
            await loader();
        } catch (error) {
            failed.push(path);
            console.error(`Failed to load tool module ${path}`, error);
        }
    }));

    return { total: devToolManager.getAllTools().length, failed };
}