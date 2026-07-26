import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import CategoryManager from "../core/CategoryManager";
import { ExecutionPanel } from "./ExecutionPanel";
import type { LogEntry } from "./TerminalOutput";
import type { DevToolOutput } from "../types/DevToolOutput";
import type { DevTool } from "../types/DevTool";

interface FormField {
  name: string;
  label: string;
  type: "text" | "file" | "select" | "number" | "textarea" | "button" | "seekbar" | "checkbox" | "radio";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  fileOptions?: {
    accept?: string;
    multiple?: boolean;
  };
  description?: string;
  onClick?: (formData: Record<string, any>) => void;
  seekbarOptions?: {
    min: number;
    max: number;
    step: number;
  };
}

interface BaseToolProps {
  toolMeta: DevTool;
  isExecuting: boolean;
  logs: LogEntry[];
  output?: DevToolOutput | DevToolOutput[];
  onExecute: (data: Record<string, any>) => void;
  clearLogs: () => void;
  fields: FormField[];
  executeButtonVisible?: boolean;
}

export function BaseTool({
  toolMeta,
  isExecuting,
  logs,
  output,
  onExecute,
  clearLogs,
  fields,
  executeButtonVisible = true
}: BaseToolProps) {
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
          {CategoryManager.getCategoryById(toolMeta.categoryId)?.name || "Tool"}
        </div>

        <h1 style={{
          fontSize: "var(--dt-text-3xl)",
          fontWeight: "var(--dt-font-bold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-2) 0"
        }}>
          {toolMeta.name}
        </h1>

        <p style={{
          fontSize: "var(--dt-text-base)",
          color: "var(--dt-text-secondary)",
          margin: 0
        }}>
          {toolMeta.description}
        </p>
      </div>

      {/* Execution Panel */}
      <ExecutionPanel
        isRemoteAvailable={false}
        isExecuting={isExecuting}
        toolName={toolMeta.id}
        fields={fields}
        executeButtonVisible={executeButtonVisible}
        logs={logs}
        onExecute={onExecute}
        output={output}
        clearLogs={clearLogs}
      />
    </div>
  );
}
