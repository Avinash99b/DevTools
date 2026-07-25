import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function SlugGenerator() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "sluggenerator-tool",
    name: "Slug Generator",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Generate URL-friendly slugs from strings.",
    tool: SlugGenerator
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input text is required.");

      const separator = data.separator === "underscore" ? "_" : "-";

      const slug = input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, separator)
        .replace(/^-+|-+$/g, '');

      setOutput({ type: "text", data: slug });
      setLogs((val) => [...val, { level: "success", message: "Slug generated successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input String",
          placeholder: "Enter text to convert to slug...",
          required: true
        },
        {
          name: "separator",
          type: "radio",
          label: "Separator",
          options: ["hyphen", "underscore"],
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Generate URL-friendly slugs from strings.",
  id: "sluggenerator-tool",
  name: "Slug Generator",
  tool: SlugGenerator
});
