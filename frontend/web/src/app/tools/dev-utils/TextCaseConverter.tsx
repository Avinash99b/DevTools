import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function TextCaseConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "textcaseconverter-tool",
    name: "Text Case Converter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Convert text between different letter cases.",
    tool: TextCaseConverter
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      const targetCase = data.targetCase;

      if (!input || typeof input !== "string") {
         throw new Error("Input text is required.");
      }

      let result = "";
      switch (targetCase) {
        case "UPPERCASE":
          result = input.toUpperCase();
          break;
        case "lowercase":
          result = input.toLowerCase();
          break;
        case "camelCase":
          result = input.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
          }).replace(/\s+/g, "");
          break;
        case "snake_case":
          result = input.replace(/\s+/g, '_').toLowerCase();
          break;
        case "kebab-case":
          result = input.replace(/\s+/g, '-').toLowerCase();
          break;
        case "Title Case":
          result = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
          break;
        default:
          result = input;
          break;
      }

      setOutput({ type: "text", data: result });
      setLogs((val) => [...val, { level: "success", message: "Text converted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input Text",
          placeholder: "Enter text...",
          required: true
        },
        {
          name: "targetCase",
          type: "select",
          label: "Target Case",
          options: ["UPPERCASE", "lowercase", "camelCase", "snake_case", "kebab-case", "Title Case"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Convert text between different letter cases.",
  id: "textcaseconverter-tool",
  name: "Text Case Converter",
  tool: TextCaseConverter
});
