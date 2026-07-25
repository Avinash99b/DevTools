import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function UrlEncoder() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "urlencoder-tool",
    name: "URL Encoder / Decoder",
    author: "System",
    categoryId: ToolCategories.ENDECODERS,
    description: "Encode and decode URLs.",
    tool: UrlEncoder
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input URL is required.");

      const isDecode = data.action === "Decode";
      let result = "";

      if (isDecode) {
        result = decodeURIComponent(input);
      } else {
        result = encodeURIComponent(input);
      }

      setOutput({ type: "text", data: result });
      setLogs((val) => [...val, { level: "success", message: `URL ${isDecode ? 'decoded' : 'encoded'} successfully`, timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input URL",
          placeholder: "https://example.com/page?query=string",
          required: true
        },
        {
          name: "action",
          type: "radio",
          label: "Action",
          options: ["Encode", "Decode"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.ENDECODERS,
  description: "Encode and decode URLs.",
  id: "urlencoder-tool",
  name: "URL Encoder / Decoder",
  tool: UrlEncoder
});
