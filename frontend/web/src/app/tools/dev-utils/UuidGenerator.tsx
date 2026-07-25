import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function UuidGenerator() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "uuidgenerator-tool",
    name: "UUID Generator",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Generate random UUIDs.",
    tool: UuidGenerator
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const count = data.count ? parseInt(data.count, 10) : 1;
      if (count < 1 || count > 1000) throw new Error("Count must be between 1 and 1000");

      const uuids: string[] = [];
      for (let i = 0; i < count; i++) {
         uuids.push(crypto.randomUUID());
      }

      setOutput({ type: "text", data: uuids.join("\n") });
      setLogs((val) => [...val, { level: "success", message: `Generated ${count} UUID(s)`, timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setLogs((val) => [...val, { level: "error", message: e.message || "Execution Failed", timestamp: new Date().toLocaleTimeString() }]);
    }
    setIsExecuting(false);
  }

  return (
    <BaseTool
      toolMeta={toolMeta}
      isExecuting={isExecuting}
      logs={logs}
      output={output}
      onExecute={execute}
      clearLogs={() => setLogs([])}
      fields={[
         {
          name: "count",
          type: "number",
          label: "Number of UUIDs",
          placeholder: "1",
          description: "Max 1000"
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Generate random UUIDs.",
  id: "uuidgenerator-tool",
  name: "UUID Generator",
  tool: UuidGenerator
});
