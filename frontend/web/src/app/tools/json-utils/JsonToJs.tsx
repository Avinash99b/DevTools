import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function JsonToJs() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "jsontojs-tool",
    name: "JSON to JS Object",
    author: "System",
    categoryId: ToolCategories.JSON,
    description: "Convert JSON strings into JavaScript objects.",
    tool: JsonToJs
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input JSON is required.");

      const parsed = JSON.parse(input);

      const serializeToJs = (obj: any, indent: string = ""): string => {
        if (typeof obj === "string") return `"${obj.replace(/"/g, '\\\"')}"`;
        if (typeof obj === "number" || typeof obj === "boolean" || obj === null) return String(obj);
        if (Array.isArray(obj)) {
          if (obj.length === 0) return "[]";
          const innerIndent = indent + "  ";
          const items = obj.map(item => innerIndent + serializeToJs(item, innerIndent)).join(",\n");
          return `[\n${items}\n${indent}]`;
        }
        if (typeof obj === "object") {
          const keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          const innerIndent = indent + "  ";
          const props = keys.map(key => {
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            return `${innerIndent}${safeKey}: ${serializeToJs(obj[key], innerIndent)}`;
          }).join(",\n");
          return `{\n${props}\n${indent}}`;
        }
        return "undefined";
      };

      const result = `const obj = ${serializeToJs(parsed)};`;

      setOutput({ type: "code", data: result });
      setLogs((val) => [...val, { level: "success", message: "Converted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          name: "input",
          type: "textarea",
          label: "Input JSON",
          placeholder: '{"key": "value"}',
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.JSON,
  description: "Convert JSON strings into JavaScript objects.",
  id: "jsontojs-tool",
  name: "JSON to JS Object",
  tool: JsonToJs
});
