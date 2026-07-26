import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function TextCleaner() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "textcleaner-tool",
    name: "Text Cleaner",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Clean, trim, and manipulate whitespace in text.",
    tool: TextCleaner,
  supportsRealtime: true
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      let result = data.input;

      if (!result || typeof result !== "string") {
        throw new Error("Input text is required.");
      }

      if (data.trimLines) {
         result = result.split('\\n').map((line: string) => line.trim()).join('\\n');
      }
      if (data.removeEmptyLines) {
         result = result.replace(/^\\s*\\n/gm, '');
      }
      if (data.removeExtraSpaces) {
         result = result.replace(/\\s{2,}/g, ' ');
      }
      if (data.reverseString) {
         result = result.split('').reverse().join('');
      }

      setOutput({ type: "text", data: result });
      setLogs((val) => [...val, { level: "success", message: "Text cleaned successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          placeholder: "Enter text to clean...",
          required: true
        },
        {
          name: "trimLines",
          type: "checkbox",
          label: "Trim Lines",
          placeholder: "Remove leading and trailing spaces from each line"
        },
        {
          name: "removeEmptyLines",
          type: "checkbox",
          label: "Remove Empty Lines",
          placeholder: "Delete all blank lines"
        },
        {
          name: "removeExtraSpaces",
          type: "checkbox",
          label: "Remove Extra Spaces",
          placeholder: "Replace multiple spaces with a single space"
        },
        {
          name: "reverseString",
          type: "checkbox",
          label: "Reverse Text",
          placeholder: "Reverse the entire text content"
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Clean, trim, and manipulate whitespace in text.",
  id: "textcleaner-tool",
  name: "Text Cleaner",
  tool: TextCleaner,
  supportsRealtime: true
});
