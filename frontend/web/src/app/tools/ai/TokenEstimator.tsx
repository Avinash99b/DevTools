import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { submitJob } from "../../core/jobs";

function TokenEstimator() {
  const [output, setOutput] = useState<any>();

  const toolMeta = {
    id: "token-estimator-tool",
    name: "Token Estimator",
    author: "System",
    categoryId: ToolCategories.AI,
    description: "Estimate tokens for a given text using tiktoken.",
    tool: TokenEstimator
  };

  const handleExecute = async (data: Record<string, any>) => {
    try {
        const response = await submitJob(toolMeta.id, data);
        if (response.status === 'completed') {
            const result = response.result;
            setOutput({
                type: "code",
                data: JSON.stringify(result, null, 2)
            });
        }
    } catch (e: any) {
        throw new Error(e.response?.data?.error || e.message || "Failed to estimate tokens");
    }
  };

  return (
    <BaseTool
      toolMeta={toolMeta}
      isExecuting={false}
      logs={[]}
      output={output}
      onExecute={handleExecute}
      clearLogs={() => setOutput(undefined)}
      fields={[
         { name: "text", type: "textarea", label: "Input Text", placeholder: "Enter text...", required: true },
         { name: "model", type: "select", label: "Model", options: ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "text-embedding-3-small"], required: true }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.AI,
  description: "Estimate tokens for a given text using tiktoken.",
  id: "token-estimator-tool",
  name: "Token Estimator",
  tool: TokenEstimator
});
