import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import * as Diff from "diff";

function DiffChecker() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "diffchecker-tool",
    name: "Diff Checker",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Compare text and find differences.",
    tool: DiffChecker
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const text1 = data.text1 || "";
      const text2 = data.text2 || "";

      if (!text1 && !text2) throw new Error("Please provide text to compare.");

      const diff = Diff.diffLines(text1, text2);

      let html = `<div style="font-family: monospace; white-space: pre-wrap; word-break: break-all;">`;

      diff.forEach((part) => {
         const color = part.added ? '#d4f2d4' : part.removed ? '#f2d4d4' : 'transparent';
         const textColor = part.added ? '#006400' : part.removed ? '#8b0000' : 'inherit';
         const text = part.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

         if (part.added) {
             html += `<span style="background-color: ${color}; color: ${textColor}; display: inline-block; width: 100%;">+ ${text}</span>`;
         } else if (part.removed) {
             html += `<span style="background-color: ${color}; color: ${textColor}; display: inline-block; width: 100%;">- ${text}</span>`;
         } else {
             html += `<span>  ${text}</span>`;
         }
      });

      html += `</div>`;

      setOutput({ type: "html", data: html });
      setLogs((val) => [...val, { level: "success", message: "Diff completed", timestamp: new Date().toLocaleTimeString() }]);
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
          name: "text1",
          type: "textarea",
          label: "Original Text",
          placeholder: "Enter original text...",
        },
        {
          name: "text2",
          type: "textarea",
          label: "Modified Text",
          placeholder: "Enter modified text...",
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Compare text and find differences.",
  id: "diffchecker-tool",
  name: "Diff Checker",
  tool: DiffChecker
});
