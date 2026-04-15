import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { TerminalOutput, type LogEntry } from "./TerminalOutput";
import type { DevToolOutput } from "../types/DevToolOutput";
import { OutputCard } from "./OutputCard";

interface FormField {
  name: string;
  label: string;
  type: "text" | "file" | "select" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
}

interface ExecutionPanelProps {
  isRemoteAvailable: boolean;
  isExecuting: boolean;
  logs: LogEntry[]
  toolName: string;
  fields: FormField[];
  onExecute: (data: Record<string, any>) => void;
  output?: DevToolOutput
}

export function ExecutionPanel({ isRemoteAvailable, isExecuting, logs, fields, onExecute, output }: ExecutionPanelProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [executionMode, setExecutionMode] = useState<"local" | "remote">("local");

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--dt-space-6)",
      height: "calc(100vh - 180px)"
    }}>
      {/* Left Panel - Input Form */}
      <div style={{
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)",
        padding: "var(--dt-space-6)",
        overflowY: "auto"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--dt-space-6)"
        }}>
          <h2 style={{
            fontSize: "var(--dt-text-xl)",
            fontWeight: "var(--dt-font-semibold)",
            color: "var(--dt-text-primary)",
            margin: 0
          }}>
            Configuration
          </h2>

          {isRemoteAvailable &&
            <div style={{
              display: "flex",
              gap: "var(--dt-space-2)",
              backgroundColor: "var(--dt-bg-tertiary)",
              padding: "var(--dt-space-1)",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)"
            }}>
              <button
                onClick={() => setExecutionMode("local")}
                style={{
                  padding: "var(--dt-space-2) var(--dt-space-3)",
                  backgroundColor: executionMode === "local" ? "var(--dt-accent-primary)" : "transparent",
                  color: executionMode === "local" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-xs)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  transition: "all var(--dt-transition-fast)"
                }}
              >
                Local
              </button>
              <button
                onClick={() => setExecutionMode("remote")}
                style={{
                  padding: "var(--dt-space-2) var(--dt-space-3)",
                  backgroundColor: executionMode === "remote" ? "var(--dt-accent-primary)" : "transparent",
                  color: executionMode === "remote" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-xs)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  transition: "all var(--dt-transition-fast)"
                }}
              >
                Remote
              </button>
            </div>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onExecute(formData) }} style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-5)" }}>
          {fields.map((field) => (
            <div key={field.name}>
              <label style={{
                display: "block",
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
                marginBottom: "var(--dt-space-2)"
              }}>
                {field.label}
                {field.required && (
                  <span style={{ color: "var(--dt-accent-error)", marginLeft: "4px" }}>*</span>
                )}
              </label>

              {field.description && (
                <p style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)",
                  margin: "0 0 var(--dt-space-2) 0"
                }}>
                  {field.description}
                </p>
              )}

              {field.type === "textarea" ? (
                <textarea
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-primary)",
                    fontSize: "var(--dt-text-sm)",
                    fontFamily: "var(--dt-font-sans)",
                    resize: "vertical"
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                  style={{
                    width: "100%",
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-primary)",
                    fontSize: "var(--dt-text-sm)"
                  }}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "file" ? (
                <div style={{
                  padding: "var(--dt-space-6)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "2px dashed var(--dt-border-secondary)",
                  borderRadius: "var(--dt-radius-md)",
                  textAlign: "center",
                  cursor: "pointer"
                }}>
                  <input
                    type="file"
                    onChange={(e) => handleFieldChange(field.name, e.target.files?.[0])}
                    required={field.required}
                    style={{ display: "none" }}
                    id={field.name}
                  />
                  <label
                    htmlFor={field.name}
                    style={{
                      cursor: "pointer",
                      color: "var(--dt-text-secondary)",
                      fontSize: "var(--dt-text-sm)"
                    }}
                  >
                    {formData[field.name]?.name || "Click to select file or drag & drop"}
                  </label>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  style={{
                    width: "100%",
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-primary)",
                    fontSize: "var(--dt-text-sm)"
                  }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isExecuting}
            style={{
              marginTop: "var(--dt-space-4)",
              padding: "var(--dt-space-3) var(--dt-space-6)",
              backgroundColor: isExecuting ? "var(--dt-bg-tertiary)" : "var(--dt-accent-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              cursor: isExecuting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--dt-space-2)",
              transition: "all var(--dt-transition-fast)",
              opacity: isExecuting ? 0.6 : 1
            }}
          >
            {isExecuting ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                Executing...
              </>
            ) : (
              <>
                <Play size={20} />
                Execute
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Panel - Logs */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dt-space-4)",
        overflow: "hidden"
      }}>
        <TerminalOutput
          logs={logs}
          title="Logs"
          height="calc(100% - 40px)"
        />
        {output ?
          <OutputCard output={output} /> : <></>}
      </div>

      {

      }

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
