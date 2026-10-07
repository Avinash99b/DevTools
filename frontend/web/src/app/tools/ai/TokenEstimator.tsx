import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { useRemoteJob } from "../../core/useRemoteJob";
import type { DevTool } from "../../types/DevTool";

const META = {
  id: "token-estimator-tool",
  name: "AI Token Estimator",
  author: "System",
  categoryId: ToolCategories.AI,
  description: "Estimate tokens and cost for text using a chosen model."
};

function TokenEstimator() {
  const job = useRemoteJob(META.id, {
    prepare: (data) => ({ text: data.text, model: data.model || "gpt-3.5-turbo" }),
    onComplete: (result) => ({
      output: {
        type: "code",
        title: "Token estimate",
        data: result,
      },
      logs: [{ level: "success" as const, message: `Estimated ${result?.tokens ?? 0} tokens.` }],
    }),
  });

  const toolMeta: DevTool = { ...META, tool: TokenEstimator };

  return (
    <BaseTool
      toolMeta={toolMeta}
      isExecuting={job.isExecuting}
      logs={job.logs}
      output={job.output}
      error={job.error}
      progress={job.progress}
      onExecute={job.execute}
      clearLogs={job.reset}
      fields={[
        {
          name: "text",
          type: "textarea",
          label: "Input Text",
          placeholder: "Paste the text you want to measure...",
          required: true
        },
        {
          name: "model",
          type: "select",
          label: "Model",
          options: ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "text-davinci-003"],
          description: "Used to pick the tokenizer encoding."
        }
      ]}
    />
  );
}

registerDevTool({ ...META, tool: TokenEstimator });