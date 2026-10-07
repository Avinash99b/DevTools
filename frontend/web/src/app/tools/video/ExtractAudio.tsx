import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { useRemoteJob } from "../../core/useRemoteJob";
import { uploadFile, fileDownloadUrl } from "../../core/jobs";
import type { DevTool } from "../../types/DevTool";

const META = {
  id: "extract-audio-tool",
  name: "Extract Audio",
  author: "System",
  categoryId: ToolCategories.VIDEO,
  description: "Extract audio track from a video file."
};

function ExtractAudio() {
  const job = useRemoteJob(META.id, {
    prepare: async (data) => {
      const file = (data.file as File[])?.[0];
      if (!file) throw new Error("No video file selected.");
      job.addLog("info", `Uploading ${file.name}...`);
      const upload = await uploadFile(file);
      return { fileId: upload.fileId, format: data.format || "mp3" };
    },
    onComplete: (result) => ({
      output: {
        type: "remoteFile",
        title: "Audio Extracted",
        data: {
          label: String(result?.filename ?? "extracted_audio"),
          href: fileDownloadUrl(String(result?.fileId ?? "")),
          meta: [
            `Size: ${((Number(result?.size) || 0) / 1024).toFixed(2)} KB`,
            `Type: ${String(result?.mimeType ?? "audio")}`,
          ],
        },
      },
      logs: [{ level: "success" as const, message: result?.message ?? "Audio extracted successfully." }],
    }),
  });

  const toolMeta: DevTool = { ...META, tool: ExtractAudio };

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
         { name: "file", type: "file", label: "Video File", fileOptions: { accept: "video/*", multiple: false }, required: true },
         { name: "format", type: "select", label: "Output Format", options: ["mp3", "aac", "wav"] }
      ]}
    />
  );
}

registerDevTool({ ...META, tool: ExtractAudio });