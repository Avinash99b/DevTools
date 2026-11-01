import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import { z } from "zod";

function JsonMinifyTool() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "jsonminify-tool",
    name: "JSON Minifier",
    author: "System",
    categoryId: ToolCategories.JSON,
    description: "Minify JSON data.",
    tool: JsonMinifyTool,
    supportsRealtime: true,
    schema: z.object({
        input: z.string().min(1, "Input JSON is required.")
    })
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;

      const parsed = JSON.parse(input);
      const result = JSON.stringify(parsed);

      setOutput({ type: "code", data: result });
      setLogs((val) => [...val, { level: "success", message: "JSON minified successfully", timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setLogs((val) => [...val, { level: "error", message: "Invalid JSON: " + e.message, timestamp: new Date().toLocaleTimeString() }]);
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
          name: "input",
          type: "textarea",
          label: "Input JSON",
          placeholder: '{\\n  "key": "value"\\n}',
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.JSON,
  description: "Minify JSON data.",
  id: "jsonminify-tool",
  name: "JSON Minifier",
  tool: JsonMinifyTool,
  supportsRealtime: true,
  schema: z.object({
    input: z.string().min(1, "Input JSON is required.")
  })
});
