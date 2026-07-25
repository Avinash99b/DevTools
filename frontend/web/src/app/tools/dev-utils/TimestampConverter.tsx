import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function TimestampConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "timestampconverter-tool",
    name: "Timestamp Converter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Convert between Unix timestamps and human-readable dates.",
    tool: TimestampConverter
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input) throw new Error("Input is required.");

      let dateObj: Date;

      // Check if input is a number (timestamp)
      if (/^\d+$/.test(input)) {
        let ts = parseInt(input, 10);
        // Auto-detect seconds vs milliseconds
        if (ts < 10000000000) ts *= 1000;
        dateObj = new Date(ts);
      } else {
        // Try parsing as ISO or date string
        dateObj = new Date(input);
      }

      if (isNaN(dateObj.getTime())) {
         throw new Error("Invalid date or timestamp format.");
      }

      const iso = dateObj.toISOString();
      const utc = dateObj.toUTCString();
      const local = dateObj.toString();
      const ms = dateObj.getTime();
      const sec = Math.floor(ms / 1000);

      const html = `
        <div style="font-family: monospace;">
          <div style="margin-bottom: 8px;"><strong>Timestamp (ms):</strong> ${ms}</div>
          <div style="margin-bottom: 8px;"><strong>Timestamp (s):</strong> ${sec}</div>
          <div style="margin-bottom: 8px;"><strong>ISO 8601:</strong> ${iso}</div>
          <div style="margin-bottom: 8px;"><strong>UTC:</strong> ${utc}</div>
          <div style="margin-bottom: 8px;"><strong>Local Time:</strong> ${local}</div>
        </div>
      `;

      setOutput({ type: "html", data: html });
      setLogs((val) => [...val, { level: "success", message: "Date converted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          type: "text",
          label: "Input Timestamp or Date",
          placeholder: "e.g., 1672531199 or 2023-01-01T00:00:00Z",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Convert between Unix timestamps and human-readable dates.",
  id: "timestampconverter-tool",
  name: "Timestamp Converter",
  tool: TimestampConverter
});
