import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function HashGenerator() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "hashgenerator-tool",
    name: "Hash Generator",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Generate cryptographic hashes (MD5, SHA-1, SHA-256).",
    tool: HashGenerator
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      const algo = data.algorithm;
      if (!input) throw new Error("Input text is required.");

      const encoder = new TextEncoder();
      const dataBuf = encoder.encode(input);

      let hashBuffer;
      if (algo === "MD5") {
         // Web Crypto API doesn't support MD5 natively.
         // For a dev tool, we ideally use a library like crypto-js, but we'll use a placeholder or warning here
         // since we didn't add an MD5 package. We will implement SHA-1 and SHA-256 natively.
         throw new Error("MD5 is considered insecure and is not natively supported by the Web Crypto API. Please use SHA-1 or SHA-256.");
      } else {
         hashBuffer = await crypto.subtle.digest(algo, dataBuf);
      }

      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setOutput({ type: "text", data: hashHex });
      setLogs((val) => [...val, { level: "success", message: `Generated ${algo} hash successfully`, timestamp: new Date().toLocaleTimeString() }]);
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
          label: "Input String",
          placeholder: "Enter text to hash...",
          required: true
        },
        {
          name: "algorithm",
          type: "select",
          label: "Algorithm",
          options: ["SHA-1", "SHA-256", "SHA-384", "SHA-512"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Generate cryptographic hashes (SHA-1, SHA-256).",
  id: "hashgenerator-tool",
  name: "Hash Generator",
  tool: HashGenerator
});
