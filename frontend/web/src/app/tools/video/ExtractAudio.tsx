import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { submitJob } from "../../core/jobs";
import { api } from "../../core/api";

function ExtractAudio() {
  const [output, setOutput] = useState<any>();

  const toolMeta = {
    id: "extract-audio-tool",
    name: "Extract Audio",
    author: "System",
    categoryId: ToolCategories.VIDEO,
    description: "Extract audio track from a video file.",
    tool: ExtractAudio
  };

  const handleExecute = async (data: Record<string, any>) => {
    try {
        const file = data.file?.[0] as File;
        if (!file) throw new Error("No video file selected");

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post('/api/files/upload', formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fileId = uploadRes.data.fileId;

        const response = await submitJob(toolMeta.id, { fileId, format: data.format || 'mp3' });

        if (response.status === 'completed') {
             setOutput({ type: 'text', data: 'Done' });
        } else {
             return { jobId: response.jobId };
        }
    } catch (e: any) {
        throw new Error(e.response?.data?.error || e.message || "Failed to extract audio");
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
         { name: "file", type: "file", label: "Video File", fileOptions: { accept: "video/*", multiple: false }, required: true },
         { name: "format", type: "select", label: "Output Format", options: ["mp3", "aac", "wav"] }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.VIDEO,
  description: "Extract audio track from a video file.",
  id: "extract-audio-tool",
  name: "Extract Audio",
  tool: ExtractAudio
});
