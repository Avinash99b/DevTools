import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function XmlFormatter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "xmlformatter-tool",
    name: "XML Formatter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Format and beautify XML data.",
    tool: XmlFormatter
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const xml = data.input;
      if (!xml || typeof xml !== "string") throw new Error("Input XML is required.");

      const minify = data.minify;
      const indentLevel = data.indentSpace ? parseInt(data.indentSpace, 10) : 2;
      const indentChar = " ".repeat(indentLevel);

      let formatted = "";

      // Remove all line breaks and spaces between tags
      const raw = xml.replace(/(>)(<)(\/*)/g, "$1\r\n$2$3");

      if (minify) {
        formatted = raw.replace(/\r\n/g, "");
      } else {
         let pad = 0;
         const lines = raw.split("\r\n");

         for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.match(/^<\w[^>]*[^\/]>.*$/)) { // Opening tag
               formatted += indentChar.repeat(pad) + line + "\n";
               if (!line.match(/<\/[^>]+>$/)) pad++; // Doesn't have closing tag on same line
            } else if (line.match(/^<\/\w/)) { // Closing tag
               if (pad > 0) pad -= 1;
               formatted += indentChar.repeat(pad) + line + "\n";
            } else if (line.match(/^<\w[^>]*\/>/)) { // Self closing tag
               formatted += indentChar.repeat(pad) + line + "\n";
            } else if (line.match(/^<\?/) || line.match(/^<!--/)) { // XML definition / Comment
               formatted += indentChar.repeat(pad) + line + "\n";
            } else { // Text node
               formatted += indentChar.repeat(pad) + line + "\n";
            }
         }
      }

      setOutput({ type: "code", data: formatted.trim() });
      setLogs((val) => [...val, { level: "success", message: "XML formatted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input XML",
          placeholder: "<root><element>value</element></root>",
          required: true
        },
        {
          name: "indentSpace",
          type: "select",
          label: "Indentation",
          options: ["2", "4", "8"],
        },
        {
          name: "minify",
          type: "checkbox",
          label: "Minify",
          placeholder: "Minify XML (remove formatting)"
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Format and beautify XML data.",
  id: "xmlformatter-tool",
  name: "XML Formatter",
  tool: XmlFormatter
});
