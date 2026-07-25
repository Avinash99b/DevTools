import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function ImageRescaler() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "imagerescaler-tool",
    name: "Image Rescaler",
    author: "System",
    categoryId: ToolCategories.IMAGE,
    description: "Scale images by percentage.",
    tool: ImageRescaler
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const files: File[] = data.image ? (Array.isArray(data.image) ? data.image : [data.image]) : [];
      if (files.length === 0) throw new Error("Please upload an image.");

      const scale = data.scale ? parseFloat(data.scale) : 0;
      if (scale <= 0) throw new Error("Scale must be greater than 0.");

      const file = files[0];

      const rescaledFile = await new Promise<File>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);

          img.onload = () => {
             const canvas = document.createElement("canvas");
             const targetWidth = Math.round(img.width * (scale / 100));
             const targetHeight = Math.round(img.height * (scale / 100));

             canvas.width = targetWidth;
             canvas.height = targetHeight;
             const ctx = canvas.getContext("2d");

             if (!ctx) return reject(new Error("Failed to get canvas context"));

             ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

             canvas.toBlob((blob) => {
                 if (!blob) return reject(new Error("Failed to create blob"));
                 const resultFile = new File([blob], `scaled_${file.name}`, { type: file.type });
                 resolve(resultFile);
             }, file.type);

             URL.revokeObjectURL(url);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
      });

      setOutput({ type: "images", data: [rescaledFile], title: "Rescaled Image" });
      setLogs((val) => [...val, { level: "success", message: "Image rescaled successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          name: "image",
          type: "file",
          label: "Upload Image",
          required: true,
          fileOptions: {
              accept: "image/*",
              multiple: false
          }
        },
        {
          name: "scale",
          type: "number",
          label: "Scale Percentage (%)",
          placeholder: "50",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.IMAGE,
  description: "Scale images by percentage.",
  id: "imagerescaler-tool",
  name: "Image Rescaler",
  tool: ImageRescaler
});
