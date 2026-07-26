import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function ImageResizer() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "imageresizer-tool",
    name: "Image Resizer",
    author: "System",
    categoryId: ToolCategories.IMAGE,
    description: "Resize images to exact dimensions.",
    tool: ImageResizer
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const files: File[] = data.image ? (Array.isArray(data.image) ? data.image : [data.image]) : [];
      if (files.length === 0) throw new Error("Please upload an image.");

      const width = data.width ? parseInt(data.width, 10) : 0;
      const height = data.height ? parseInt(data.height, 10) : 0;
      if (width <= 0 || height <= 0) throw new Error("Width and height must be greater than 0.");

      const file = files[0]; // Process only the first for simplicity

      const resizedFile = await new Promise<File>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);

          img.onload = () => {
             const canvas = document.createElement("canvas");
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext("2d");

             if (!ctx) return reject(new Error("Failed to get canvas context"));

             ctx.drawImage(img, 0, 0, width, height);

             canvas.toBlob((blob) => {
                 if (!blob) return reject(new Error("Failed to create blob"));
                 const resultFile = new File([blob], `resized_${file.name}`, { type: file.type });
                 resolve(resultFile);
             }, file.type);

             URL.revokeObjectURL(url);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
      });

      setOutput({ type: "images", data: [resizedFile], title: "Resized Image" });
      setLogs((val) => [...val, { level: "success", message: "Image resized successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          name: "width",
          type: "number",
          label: "Width (px)",
          placeholder: "800",
          required: true
        },
        {
          name: "height",
          type: "number",
          label: "Height (px)",
          placeholder: "600",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.IMAGE,
  description: "Resize images to exact dimensions.",
  id: "imageresizer-tool",
  name: "Image Resizer",
  tool: ImageResizer
});
