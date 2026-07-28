import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import { submitJob } from "../../core/jobs";
import { api } from "../../core/api";

function ProxyDownloader() {
  const [output, setOutput] = useState<any>();

  const toolMeta = {
    id: "proxy-downloader-tool",
    name: "Proxy File Downloader",
    author: "System",
    categoryId: ToolCategories.NETWORK,
    description: "Download files through the server to bypass CORS or hide your IP.",
    tool: ProxyDownloader
  };

  const handleExecute = async (data: Record<string, any>) => {
    try {
        const response = await submitJob(toolMeta.id, data);
        if (response.status === 'completed') {
            const result = response.result;
            const downloadUrl = `${api.defaults.baseURL}/api/files/${result.fileId}`;
            setOutput({
                type: "html",
                data: `<div style="padding: 16px;">
                         <h3>Download Complete</h3>
                         <p>Filename: ${result.filename}</p>
                         <p>Size: ${(result.size / 1024).toFixed(2)} KB</p>
                         <p>Type: ${result.mimeType}</p>
                         <a href="${downloadUrl}" target="_blank" download style="color: var(--dt-accent-primary); text-decoration: underline;">Click here to save the file</a>
                       </div>`
            });
        } else {
             return { jobId: response.jobId };
        }
    } catch (e: any) {
        throw new Error(e.response?.data?.error || e.message || "Failed to download file");
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

registerDevTool({
  author: "System",
  categoryId: ToolCategories.NETWORK,
  description: "Download files through the server to bypass CORS or hide your IP.",
  id: "proxy-downloader-tool",
  name: "Proxy File Downloader",
  tool: ProxyDownloader
});
