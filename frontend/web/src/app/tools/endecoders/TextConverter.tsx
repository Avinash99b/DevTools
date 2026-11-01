import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import { z } from "zod";

function TextConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "textconverter-tool",
    name: "Text to ASCII / Binary",
    author: "System",
    categoryId: ToolCategories.ENDECODERS,
    description: "Convert text to ASCII codes or Binary representations.",
    tool: TextConverter,
    supportsRealtime: true,
    schema: z.object({
        input: z.string().min(1, "Input text is required."),
        format: z.enum(["ASCII", "Binary"])
    })
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      const format = data.format;

      let result = "";

      if (format === "ASCII") {
          result = Array.from(input).map(char => (char as string).charCodeAt(0)).join(" ");
      } else if (format === "Binary") {
          result = Array.from(input).map(char => (char as string).charCodeAt(0).toString(2).padStart(8, '0')).join(" ");
      }

      setOutput({ type: "text", data: result });
      setLogs((val) => [...val, { level: "success", message: `Converted to ${format} successfully`, timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setLogs((val) => [...val, { level: "error", message: e.message || "Conversion failed", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input Text",
          placeholder: 'Hello World',
          required: true
        },
        {
          name: "format",
          type: "radio",
          label: "Output Format",
          options: ["ASCII", "Binary"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.ENDECODERS,
  description: "Convert text to ASCII codes or Binary representations.",
  id: "textconverter-tool",
  name: "Text to ASCII / Binary",
  tool: TextConverter,
  supportsRealtime: true,
  schema: z.object({
    input: z.string().min(1, "Input text is required."),
    format: z.enum(["ASCII", "Binary"])
  })
});
