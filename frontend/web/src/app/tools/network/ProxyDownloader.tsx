import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { useRemoteJob } from "../../core/useRemoteJob";
import { fileDownloadUrl } from "../../core/jobs";
import type { DevTool } from "../../types/DevTool";

const META = {
  id: "proxy-downloader-tool",
  name: "Proxy File Downloader",
  author: "System",
  categoryId: ToolCategories.NETWORK,
  description: "Download files through the server to bypass CORS or hide your IP."
};

function ProxyDownloader() {
  const job = useRemoteJob(META.id, {
    onComplete: (result) => ({
      output: {
        type: "remoteFile",
        title: "Download Complete",
        data: {
          label: String(result?.filename ?? "download"),
          href: fileDownloadUrl(String(result?.fileId ?? "")),
          meta: [
            `Size: ${((Number(result?.size) || 0) / 1024).toFixed(2)} KB`,
            `Type: ${String(result?.mimeType ?? "unknown")}`,
            `Source: ${String(result?.url ?? "")}`,
          ],
        },
      },
      logs: [{ level: "success" as const, message: `Downloaded ${result?.filename ?? "file"}` }],
    }),
  });

  const toolMeta: DevTool = { ...META, tool: ProxyDownloader };

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
          name: "url",
          type: "text",
          label: "File URL",
          placeholder: "https://example.com/file.zip",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({ ...META, tool: ProxyDownloader });