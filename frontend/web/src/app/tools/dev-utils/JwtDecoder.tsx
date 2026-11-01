import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import { z } from "zod";

function JwtDecoder() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "jwtdecoder-tool",
    name: "JWT Decoder",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Decode JSON Web Tokens (JWT).",
    tool: JwtDecoder,
    supportsRealtime: true,
    schema: z.object({
        input: z.string().min(1, "Input JWT is required.").regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, "Invalid JWT format")
    })
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;

      const parts = input.split('.');
      if (parts.length !== 3) {
          throw new Error("JWT must have 3 parts.");
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      const result = {
          header,
          payload
      };

      setOutput({ type: "code", data: JSON.stringify(result, null, 2) });
      setLogs((val) => [...val, { level: "success", message: "JWT decoded successfully", timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setLogs((val) => [...val, { level: "error", message: e.message || "Invalid JWT", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input JWT",
          placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI... ',
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Decode JSON Web Tokens (JWT).",
  id: "jwtdecoder-tool",
  name: "JWT Decoder",
  tool: JwtDecoder,
  supportsRealtime: true,
  schema: z.object({
    input: z.string().min(1, "Input JWT is required.").regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, "Invalid JWT format")
  })
});
