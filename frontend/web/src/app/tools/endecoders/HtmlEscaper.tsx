import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function HtmlEscaper() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "htmlescaper-tool",
    name: "HTML Escaper / Unescaper",
    author: "System",
    categoryId: ToolCategories.ENDECODERS,
    description: "Escape and unescape HTML entities.",
    tool: HtmlEscaper,
  supportsRealtime: true
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input HTML string is required.");

      const isUnescape = data.action === "Unescape";
      let result = "";

      if (isUnescape) {
        result = input
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
      } else {
        result = input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
      }

      setOutput({ type: "code", data: result });
      setLogs((val) => [...val, { level: "success", message: `HTML ${isUnescape ? 'unescaped' : 'escaped'} successfully`, timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input HTML",
          placeholder: "<div>...</div>",
          required: true
        },
        {
          name: "action",
          type: "radio",
          label: "Action",
          options: ["Escape", "Unescape"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.ENDECODERS,
  description: "Escape and unescape HTML entities.",
  id: "htmlescaper-tool",
  name: "HTML Escaper / Unescaper",
  tool: HtmlEscaper,
  supportsRealtime: true
});
