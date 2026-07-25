import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function RegexTester() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "regextester-tool",
    name: "Regex Tester",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Test regular expressions against text.",
    tool: RegexTester
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const regexStr = data.regex;
      const flags = data.flags || "g";
      const testString = data.testString;

      if (!regexStr) throw new Error("Regex string is required.");
      if (!testString) throw new Error("Test string is required.");

      const regex = new RegExp(regexStr, flags);
      const matches = [...testString.matchAll(regex)];

      let htmlOutput = `<div style="font-family: monospace; white-space: pre-wrap;">`;

      let lastIndex = 0;
      matches.forEach((match) => {
         const start = match.index;
         if (start === undefined) return;
         const end = start + match[0].length;

         // Add unhighlighted text before match
         htmlOutput += testString.slice(lastIndex, start)
             .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

         // Add highlighted match
         htmlOutput += `<mark style="background-color: var(--dt-accent-primary); color: white; border-radius: 2px; padding: 0 2px;">${testString.slice(start, end).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</mark>`;

         lastIndex = end;
      });

      // Add remaining text
      htmlOutput += testString.slice(lastIndex)
             .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      htmlOutput += `</div>`;

      htmlOutput += `<div style="margin-top: 16px; font-weight: bold;">Found ${matches.length} matches.</div>`;

      if (matches.length > 0) {
        htmlOutput += `<ul style="margin-top: 8px; padding-left: 20px;">`;
        matches.forEach((match, i) => {
           let groups = "";
           if (match.length > 1) {
              groups = `<br/><span style="font-size: 0.8em; color: var(--dt-text-tertiary);">Groups: ${match.slice(1).map((g: string) => `[${g}]`).join(", ")}</span>`;
           }
           htmlOutput += `<li>Match ${i + 1} at index ${match.index}: <strong>${match[0]}</strong>${groups}</li>`;
        });
        htmlOutput += `</ul>`;
      }


      setOutput({ type: "html", data: htmlOutput });
      setLogs((val) => [...val, { level: "success", message: `Regex executed. Found ${matches.length} matches.`, timestamp: new Date().toLocaleTimeString() }]);
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
          name: "regex",
          type: "text",
          label: "Regular Expression",
          placeholder: "[A-Z][a-z]+",
          required: true
        },
        {
          name: "flags",
          type: "text",
          label: "Flags",
          placeholder: "g, i, m",
          description: "Default is 'g' (global). Add 'i' for case-insensitive, etc."
        },
        {
          name: "testString",
          type: "textarea",
          label: "Test String",
          placeholder: "Enter text to test against the regex...",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Test regular expressions against text.",
  id: "regextester-tool",
  name: "Regex Tester",
  tool: RegexTester
});
