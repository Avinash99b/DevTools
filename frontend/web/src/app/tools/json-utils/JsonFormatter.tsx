import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function JsonFormatter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "jsonformatter-tool",
    name: "JSON Formatter",
    author: "System",
    categoryId: ToolCategories.JSON,
    description: "Format and beautify JSON data.",
    tool: JsonFormatter,
  supportsRealtime: true
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input JSON is required.");

      const parsed = JSON.parse(input);

      const indent = data.minify ? 0 : (data.indentSpace ? parseInt(data.indentSpace, 10) : 2);
      const result = JSON.stringify(parsed, null, indent);

      setOutput({ type: "code", data: result });
      setLogs((val) => [...val, { level: "success", message: "JSON formatted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          placeholder: '{"key":"value"}',
          required: true
        },
        {
          name: "indentSpace",
          type: "select",
          label: "Indentation",
          options: ["2", "4", "8"],
        },
        {
          name: "minify",
          type: "checkbox",
          label: "Minify",
          placeholder: "Minify JSON (remove all spaces)"
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.JSON,
  description: "Format and beautify JSON data.",
  id: "jsonformatter-tool",
  name: "JSON Formatter",
  tool: JsonFormatter,
  supportsRealtime: true
});
