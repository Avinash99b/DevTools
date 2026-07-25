import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import QRCode from "qrcode";

function QrCodeGenerator() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "qrcodegenerator-tool",
    name: "QR Code Generator",
    author: "System",
    categoryId: ToolCategories.IMAGE,
    description: "Generate QR codes from URLs or text.",
    tool: QrCodeGenerator
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input text is required.");

      const size = data.size ? parseInt(data.size, 10) : 200;

      const dataUrl = await QRCode.toDataURL(input, { width: size, margin: 1 });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "qrcode.png", { type: "image/png" });

      setOutput({ type: "images", data: [file], title: "QR Code" });
      setLogs((val) => [...val, { level: "success", message: "QR Code generated successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input Text or URL",
          placeholder: "https://example.com",
          required: true
        },
        {
          name: "size",
          type: "number",
          label: "Size (px)",
          placeholder: "200",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.IMAGE,
  description: "Generate QR codes from URLs or text.",
  id: "qrcodegenerator-tool",
  name: "QR Code Generator",
  tool: QrCodeGenerator
});
