import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function ImageFormatConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "imageformatconverter-tool",
    name: "Image Format Converter",
    author: "System",
    categoryId: ToolCategories.IMAGE,
    description: "Convert images to different formats.",
    tool: ImageFormatConverter
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const files: File[] = data.image ? (Array.isArray(data.image) ? data.image : [data.image]) : [];
      if (files.length === 0) throw new Error("Please upload an image.");

      const format = data.format;
      if (!format) throw new Error("Please select a format.");

      const mimeType = `image/${format}`;
      const file = files[0];

      const convertedFile = await new Promise<File>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);

          img.onload = () => {
             const canvas = document.createElement("canvas");
             canvas.width = img.width;
             canvas.height = img.height;
             const ctx = canvas.getContext("2d");

             if (!ctx) return reject(new Error("Failed to get canvas context"));

             // Draw white background if converting to JPEG to prevent black backgrounds for transparent images
             if (format === "jpeg") {
                 ctx.fillStyle = "#ffffff";
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
             }

             ctx.drawImage(img, 0, 0);

             canvas.toBlob((blob) => {
                 if (!blob) return reject(new Error("Failed to create blob"));

                 const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                 const resultFile = new File([blob], `${originalName}.${format}`, { type: mimeType });
                 resolve(resultFile);
             }, mimeType, 0.92); // 0.92 is default quality for JPEG/WebP

             URL.revokeObjectURL(url);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
      });

      setOutput({ type: "images", data: [convertedFile], title: "Converted Image" });
      setLogs((val) => [...val, { level: "success", message: `Image converted to ${format} successfully`, timestamp: new Date().toLocaleTimeString() }]);
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
          name: "format",
          type: "select",
          label: "Target Format",
          options: ["jpeg", "png", "webp"],
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.IMAGE,
  description: "Convert images to different formats.",
  id: "imageformatconverter-tool",
  name: "Image Format Converter",
  tool: ImageFormatConverter
});
