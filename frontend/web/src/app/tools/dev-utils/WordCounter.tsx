import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function WordCounter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "wordcounter-tool",
    name: "Word/Character Counter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Count characters, words, and lines in a text.",
    tool: WordCounter,
  supportsRealtime: true
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input || "";

      const charCount = input.length;
      const charCountNoSpaces = input.replace(/\s/g, '').length;
      const words = input.trim() === "" ? 0 : input.trim().split(/\s+/).length;
      const lines = input.split(/\r\n|\r|\n/).length;

      const result = `Characters: ${charCount}\nCharacters (no spaces): ${charCountNoSpaces}\nWords: ${words}\nLines: ${lines}`;

      setOutput({ type: "text", data: result });
      setLogs((val) => [...val, { level: "success", message: "Count completed", timestamp: new Date().toLocaleTimeString() }]);
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
          placeholder: "Enter text to count...",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Count characters, words, and lines in a text.",
  id: "wordcounter-tool",
  name: "Word/Character Counter",
  tool: WordCounter,
  supportsRealtime: true
});
