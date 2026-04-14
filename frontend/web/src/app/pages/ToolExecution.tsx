import { useParams, Link } from "react-router";
import { ArrowLeft, Info } from "lucide-react";
import { ExecutionPanel } from "../components/ExecutionPanel";

export function ToolExecution() {
  const { toolId } = useParams();

  // Mock tool data - in real app, fetch based on toolId
  const toolData: Record<string, any> = {
    "image-compress": {
      name: "Image Compressor",
      description: "Compress images while maintaining quality using advanced algorithms",
      category: "Image Tools",
      fields: [
        {
          name: "input",
          label: "Input Image",
          type: "file",
          required: true,
          description: "Select the image you want to compress (JPEG, PNG, WebP)"
        },
        {
          name: "quality",
          label: "Compression Quality",
          type: "number",
          placeholder: "85",
          required: true,
          description: "Quality level (1-100). Higher values = better quality but larger file size"
        },
        {
          name: "format",
          label: "Output Format",
          type: "select",
          required: true,
          options: ["JPEG", "PNG", "WebP"],
          description: "Target format for the compressed image"
        },
        {
          name: "maxWidth",
          label: "Max Width (optional)",
          type: "number",
          placeholder: "1920",
          required: false,
          description: "Maximum width in pixels. Leave empty to keep original dimensions"
        }
      ]
    },
    "json-formatter": {
      name: "JSON Formatter",
      description: "Format, validate, and beautify JSON data",
      category: "Utilities",
      fields: [
        {
          name: "json",
          label: "JSON Input",
          type: "textarea",
          placeholder: '{"key": "value"}',
          required: true,
          description: "Paste your JSON data here"
        },
        {
          name: "indent",
          label: "Indentation",
          type: "select",
          required: true,
          options: ["2 spaces", "4 spaces", "Tabs"],
          description: "Choose indentation style"
        },
        {
          name: "sortKeys",
          label: "Sort Keys",
          type: "select",
          options: ["Yes", "No"],
          description: "Alphabetically sort object keys"
        }
      ]
    },
    "apk-analyzer": {
      name: "APK Analyzer",
      description: "Analyze Android package structure and metadata",
      category: "APK/AAB Tools",
      fields: [
        {
          name: "apk",
          label: "APK File",
          type: "file",
          required: true,
          description: "Upload the APK file to analyze"
        },
        {
          name: "deepScan",
          label: "Analysis Depth",
          type: "select",
          required: true,
          options: ["Basic", "Standard", "Deep"],
          description: "Level of analysis to perform"
        },
        {
          name: "extractResources",
          label: "Extract Resources",
          type: "select",
          options: ["Yes", "No"],
          description: "Extract and analyze resource files"
        }
      ]
    }
  };

  const tool = toolData[toolId || ""] || toolData["image-compress"];

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--dt-space-6)" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            color: "var(--dt-text-tertiary)",
            textDecoration: "none",
            fontSize: "var(--dt-text-sm)",
            transition: "color var(--dt-transition-fast)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--dt-accent-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--dt-text-tertiary)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      {/* Tool Header */}
      <div style={{
        marginBottom: "var(--dt-space-8)",
        padding: "var(--dt-space-6)",
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)"
      }}>
        <div style={{
          display: "inline-block",
          padding: "var(--dt-space-1) var(--dt-space-3)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          border: "1px solid var(--dt-accent-primary)",
          borderRadius: "var(--dt-radius-full)",
          fontSize: "var(--dt-text-xs)",
          fontWeight: "var(--dt-font-medium)",
          color: "var(--dt-accent-primary)",
          marginBottom: "var(--dt-space-3)"
        }}>
          {tool.category}
        </div>
        
        <h1 style={{
          fontSize: "var(--dt-text-3xl)",
          fontWeight: "var(--dt-font-bold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-2) 0"
        }}>
          {tool.name}
        </h1>
        
        <p style={{
          fontSize: "var(--dt-text-base)",
          color: "var(--dt-text-secondary)",
          margin: 0
        }}>
          {tool.description}
        </p>

        {/* Info Banner */}
        <div style={{
          marginTop: "var(--dt-space-4)",
          padding: "var(--dt-space-3)",
          backgroundColor: "rgba(59, 130, 246, 0.05)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "var(--dt-radius-md)",
          display: "flex",
          gap: "var(--dt-space-3)",
          alignItems: "flex-start"
        }}>
          <Info size={18} color="var(--dt-status-running)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
            <strong style={{ color: "var(--dt-text-primary)" }}>Execution Mode:</strong> You can run this tool locally on your device or remotely on a server. Switch between modes using the toggle in the configuration panel.
          </div>
        </div>
      </div>

      {/* Execution Panel */}
      <ExecutionPanel 
        toolName={tool.name}
        fields={tool.fields}
      />
    </div>
  );
}
