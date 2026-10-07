import type { DevTool } from "../types/DevTool";

class DevToolManager {
    tools: DevTool[] = []
    private listeners = new Set<() => void>()
    private snapshot: DevTool[] = []

    getToolCountByCategoryId(categoryId: string) {
        return this.tools.filter((it) => it.categoryId === categoryId).length
    }

    getToolsByCategoryId(categoryId: string): DevTool[] {
        if (categoryId === "all") return this.tools;
        return this.tools.filter((it) => it.categoryId === categoryId)
    }
    registerTool(devTool: DevTool) {
        this.tools.push(devTool)
        this.emit()
    }
    getToolById(id: string) {
        return this.tools.find((it) => it.id === id);
    }
    getAllTools() {
        return this.tools;
    }

    /** Subscribe to registry changes. Returns an unsubscribe function. */
    subscribe(listener: () => void) {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    /** Stable snapshot for React's useSyncExternalStore. */
    getSnapshot() {
        return this.snapshot
    }

    private emit() {
        this.snapshot = [...this.tools]
        this.listeners.forEach((listener) => {
            try { listener() } catch { /* a broken listener must not stop others */ }
        })
    }
}

const devToolManager = new DevToolManager();
export function registerDevTool(devTool: DevTool) {
    //Check if any dev tool already exists with that id
    if (devToolManager.getToolById(devTool.id)) {
        throw new Error("Already a tool with that id registered")
    }
    devToolManager.registerTool(devTool)
}

export default devToolManager;