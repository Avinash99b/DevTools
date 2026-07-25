import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function ColorConverter() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "colorconverter-tool",
    name: "Color Converter",
    author: "System",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Convert between different color formats (HEX, RGB, HSL).",
    tool: ColorConverter
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      const input = data.input;
      if (!input || typeof input !== "string") throw new Error("Input color is required.");
      const color = input.trim().toLowerCase();

      let r = 0, g = 0, b = 0, a = 1;

      // Parse input
      if (color.startsWith("#")) {
        const hex = color.replace("#", "");
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else if (hex.length === 8) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
          a = parseInt(hex.substring(6, 8), 16) / 255;
        } else {
          throw new Error("Invalid HEX format");
        }
      } else if (color.startsWith("rgb")) {
        const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
        if (!match) throw new Error("Invalid RGB format");
        r = parseInt(match[1], 10);
        g = parseInt(match[2], 10);
        b = parseInt(match[3], 10);
        if (match[4]) a = parseFloat(match[4]);
      } else if (color.startsWith("hsl")) {
         const match = color.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/);
         if (!match) throw new Error("Invalid HSL format");

         const h = parseInt(match[1], 10) / 360;
         const s = parseFloat(match[2]) / 100;
         const l = parseFloat(match[3]) / 100;
         if (match[4]) a = parseFloat(match[4]);

         let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
         let p = 2 * l - q;

         const hue2rgb = (p: number, q: number, t: number) => {
             if(t < 0) t += 1;
             if(t > 1) t -= 1;
             if(t < 1/6) return p + (q - p) * 6 * t;
             if(t < 1/2) return q;
             if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
             return p;
         };

         r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
         g = Math.round(hue2rgb(p, q, h) * 255);
         b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
      } else {
        throw new Error("Unsupported color format. Please use HEX, RGB, or HSL.");
      }

      // Convert to output formats
      const hexOut = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase() +
                     (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase() : "");

      const rgbOut = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;

      // RGB to HSL
      const rRatio = r / 255, gRatio = g / 255, bRatio = b / 255;
      const max = Math.max(rRatio, gRatio, bRatio), min = Math.min(rRatio, gRatio, bRatio);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rRatio: h = (gRatio - bRatio) / d + (gRatio < bRatio ? 6 : 0); break;
          case gRatio: h = (bRatio - rRatio) / d + 2; break;
          case bRatio: h = (rRatio - gRatio) / d + 4; break;
        }
        h /= 6;
      }
      const hslOut = a < 1
        ? `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`
        : `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

      const html = `
        <div style="display: flex; gap: 24px; align-items: center; font-family: monospace;">
          <div style="width: 100px; height: 100px; border-radius: 8px; border: 1px solid #ccc; background-color: ${rgbOut}; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
          <div>
            <div><strong>HEX:</strong> ${hexOut}</div>
            <div style="margin-top: 8px;"><strong>RGB:</strong> ${rgbOut}</div>
            <div style="margin-top: 8px;"><strong>HSL:</strong> ${hslOut}</div>
          </div>
        </div>
      `;

      setOutput({ type: "html", data: html });
      setLogs((val) => [...val, { level: "success", message: "Color converted successfully", timestamp: new Date().toLocaleTimeString() }]);
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
          type: "text",
          label: "Input Color",
          placeholder: "#FF5733, rgb(255,87,51), hsl(10,100%,60%)",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.DEV_UTILS,
  description: "Convert between different color formats (HEX, RGB, HSL).",
  id: "colorconverter-tool",
  name: "Color Converter",
  tool: ColorConverter
});
