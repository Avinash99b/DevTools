import { BackendTool } from './BackendTool';
class ToolRegistry {
    private tools = new Map<string, BackendTool>();
    register(tool: BackendTool) {
        if (this.tools.has(tool.id)) throw new Error(`Tool with ID ${tool.id} is already registered.`);
        this.tools.set(tool.id, tool);
    }
    getTool(id: string): BackendTool | undefined { return this.tools.get(id); }
    getAllTools(): BackendTool[] { return Array.from(this.tools.values()); }
}
export const registry = new ToolRegistry();
