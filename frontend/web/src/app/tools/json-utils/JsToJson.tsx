import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function JsToJson() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "jstojson-tool",
    name: "JS Object to JSON",
    author: "System",
    categoryId: ToolCategories.JSON,
    description: "Convert JavaScript objects into JSON format.",
    tool: JsToJson
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input JS object is required.");

      // Safely evaluate the JS object literal string
      // Note: In a real-world secure env, we'd use a proper parser (like acorn) or run this in an iframe/worker,
      // but for a dev tool, Function constructor is a pragmatic choice to evaluate object literals.
      let evaluatedObj;
      try {
        const cleanInput = input.trim().replace(/^const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*/, '').replace(/;$/, '');
        // eslint-disable-next-line no-new-func
        evaluatedObj = new Function("return (" + cleanInput + ")")();
      } catch (err) {
        throw new Error("Invalid JavaScript object syntax.");
      }

      const result = JSON.stringify(evaluatedObj, null, 2);

      setOutput({ type: "code", data: result });
      setLogs((val) => [...val, { level: "success", message: "Converted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input JS Object",
          placeholder: "{ key: 'value' }",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.JSON,
  description: "Convert JavaScript objects into JSON format.",
  id: "jstojson-tool",
  name: "JS Object to JSON",
  tool: JsToJson
});
