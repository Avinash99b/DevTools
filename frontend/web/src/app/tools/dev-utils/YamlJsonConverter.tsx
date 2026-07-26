import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import * as yaml from "js-yaml";

function YamlJsonConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "yamljsonconverter-tool",
    name: "YAML / JSON Converter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Convert between YAML and JSON formats.",
    tool: YamlJsonConverter,
  supportsRealtime: true
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input text is required.");

      const direction = data.direction;
      let result = "";

      if (direction === "YAML to JSON") {
        const parsed = yaml.load(input);
        result = JSON.stringify(parsed, null, 2);
      } else {
        const parsed = JSON.parse(input);
        result = yaml.dump(parsed);
      }

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
          label: "Input Data",
          placeholder: "Enter YAML or JSON...",
          required: true
        },
        {
          name: "direction",
          type: "radio",
          label: "Conversion Direction",
          options: ["YAML to JSON", "JSON to YAML"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Convert between YAML and JSON formats.",
  id: "yamljsonconverter-tool",
  name: "YAML / JSON Converter",
  tool: YamlJsonConverter,
  supportsRealtime: true
});
