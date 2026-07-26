import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import { marked } from "marked";

function MarkdownPreview() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "markdownpreview-tool",
    name: "Markdown to HTML",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Convert Markdown to HTML.",
    tool: MarkdownPreview
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input markdown is required.");

      const html = await marked.parse(input);

      setOutput({ type: "html", data: html, title: "HTML Preview" });
      setLogs((val) => [...val, { level: "success", message: "Markdown parsed successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input Markdown",
          placeholder: "# Hello World\\n\\nThis is **bold** text.",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Convert Markdown to HTML.",
  id: "markdownpreview-tool",
  name: "Markdown to HTML",
  tool: MarkdownPreview
});
