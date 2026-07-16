import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { TerminalOutput, type LogEntry } from "./TerminalOutput";
import type { DevToolOutput } from "../types/DevToolOutput";
import { OutputCard } from "./OutputCard";
import { useIsMobile } from "./ui/use-mobile";

interface FormField {
  name: string;
  label: string;
  type: "text" | "file" | "select" | "number" | "textarea" | "button" | "seekbar";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  fileOptions?: {
    accept?: string;
    multiple?: boolean;
  };
  description?: string;
  onClick?: (formData: Record<string, any>) => void; // For button type
  seekbarOptions?: {
    min: number;
    max: number;
    step: number;
  };
}

interface ExecutionPanelProps {
  executeButtonVisible?: boolean;
  isRemoteAvailable: boolean;
  isExecuting: boolean;
  logs: LogEntry[]
  toolName: string;
  fields: FormField[];
  onExecute: (data: Record<string, any>) => void;
  output?: DevToolOutput
  clearLogs?: () => void;
}

interface FileItem {
  file: File;
  preview: string;
  selected: boolean;
}


export function ExecutionPanel({ executeButtonVisible = true, isRemoteAvailable, isExecuting, logs, fields, onExecute, output, clearLogs }: ExecutionPanelProps) {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [executionMode, setExecutionMode] = useState<"local" | "remote">("local");
  const [fileState, setFileState] = useState<Record<string, FileItem[]>>({});

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSelect = (fieldName: string, index: number) => {
    setFileState(prev => {
      const updated = [...(prev[fieldName] || [])];
      updated[index].selected = !updated[index].selected;

      //Remove unselected files from formData
      const selectedFiles = updated.filter(item => item.selected).map(item => item.file);
      handleFieldChange(fieldName, selectedFiles);
      return { ...prev, [fieldName]: updated };
    });
  };

  const removeFile = (fieldName: string, index: number) => {
    setFileState(prev => {
      const updated = [...(prev[fieldName] || [])];
      updated.splice(index, 1);
      return { ...prev, [fieldName]: updated };
    });
  };

  const handleFileChange = (name: string, files: FileList | null) => {
    if (!files) return;

    const newFiles: FileItem[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      selected: true
    }));

    setFileState(prev => ({
      ...prev,
      [name]: [...(prev[name] || []), ...newFiles]
    }));

    handleFieldChange(name, newFiles.map(f => f.file));
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "var(--dt-space-6)",
      height: isMobile ? "auto" : "calc(100vh - 180px)",
      minHeight: isMobile ? "auto" : "420px"
    }}>
      {/* Left Panel - Input Form */}
      <div style={{
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)",
        padding: isMobile ? "var(--dt-space-4)" : "var(--dt-space-6)",
        overflowY: "auto",
        minWidth: 0
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
              border: "1px solid var(--dt-border-primary)",
              flexWrap: "wrap"
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
              {field.type !== "button" && (
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
              )}

              {field.description && (
                <p style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)",
                  margin: "0 0 var(--dt-space-2) 0"
                }}>
                  {field.description}
                </p>
              )}

              {
                field.type === "button" && (
                  <button
                    type="button"
                    onClick={() => field.onClick && field.onClick(formData)}
                    style={{
                      padding: "var(--dt-space-3) var(--dt-space-6)",
                      backgroundColor: "var(--dt-accent-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--dt-radius-md)",
                      fontSize: "var(--dt-text-sm)",
                      fontWeight: "var(--dt-font-medium)",
                      cursor: "pointer",
                      transition: "all var(--dt-transition-fast)",
                      minHeight: "40px"
                    }}
                  >
                    {field.label}
                  </button>
                )
              }
              {field.type === "textarea" ? (
                <textarea
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-primary)",
                    fontSize: "var(--dt-text-sm)",
                    fontFamily: "var(--dt-font-sans)",
                    resize: "vertical",
                    minHeight: "132px"
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-primary)",
                    fontSize: "var(--dt-text-sm)",
                    minHeight: "42px"
                  }}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) :

                field.type === "file" && (
                  <div>
                    {/* Upload Box */}
                    <div style={{
                      padding: "var(--dt-space-6)",
                      background: "linear-gradient(145deg, var(--dt-bg-tertiary), var(--dt-bg-secondary))",
                      border: "2px dashed var(--dt-border-secondary)",
                      borderRadius: "var(--dt-radius-lg)",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="file"
                        multiple={field.fileOptions?.multiple}
                        accept={field.fileOptions?.accept}
                        onChange={(e) => handleFileChange(field.name, e.target.files)}
                        style={{ display: "none" }}
                        id={field.name}
                      />

                      <label htmlFor={field.name} style={{
                        cursor: "pointer",
                        color: "var(--dt-text-secondary)",
                        fontSize: "var(--dt-text-sm)"
                      }}>
                        ✨ Click or drag files here
                      </label>
                    </div>

                    {/* Preview Grid */}
                    <div style={{
                      marginTop: "var(--dt-space-4)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "var(--dt-space-3)"
                    }}>
                      {(fileState[field.name] || []).map((item, index) => {
                        const isImage = item.file.type.startsWith("image/");
                        const isVideo = item.file.type.startsWith("video/");

                        return (
                          <div key={index} style={{
                            position: "relative",
                            borderRadius: "var(--dt-radius-md)",
                            overflow: "hidden",
                            border: item.selected
                              ? "2px solid var(--dt-accent-primary)"
                              : "1px solid var(--dt-border-primary)",
                            transition: "all 0.2s ease",
                            boxShadow: item.selected
                              ? "0 0 0 2px rgba(100,150,255,0.2)"
                              : "none"
                          }}>
                            {/* Preview */}
                            {isImage && (
                              <img
                                src={item.preview}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  objectFit: "cover"
                                }}
                              />
                            )}

                            {isVideo && (
                              <video
                                src={item.preview}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  objectFit: "cover"
                                }}
                              />
                            )}

                            {!isImage && !isVideo && (
                              <div style={{
                                height: "100px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "var(--dt-bg-tertiary)",
                                fontSize: "12px"
                              }}>
                                {item.file.name}
                              </div>
                            )}

                            {/* Select Toggle */}
                            <div
                              onClick={() => toggleSelect(field.name, index)}
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: item.selected
                                  ? "var(--dt-accent-primary)"
                                  : "rgba(0,0,0,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "white"
                              }}
                            >
                              {item.selected ? "✓" : ""}
                            </div>

                            {/* Remove Button */}
                            <div
                              onClick={() => removeFile(field.name, index)}
                              style={{
                                position: "absolute",
                                top: 6,
                                left: 6,
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "rgba(255,0,0,0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "white"
                              }}
                            >
                              ✕
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


              {
                field.type === "seekbar" && (
                  <div style={{ padding: "var(--dt-space-3)" }}>
                    <input
                      type="range"
                      min={field.seekbarOptions?.min}
                      max={field.seekbarOptions?.max}
                      step={field.seekbarOptions?.step}
                      value={formData[field.name] || field.seekbarOptions?.max || 100}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      style={{ width: "100%" }}
                    />
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--dt-text-xs)",
                      color: "var(--dt-text-secondary)"
                    }}>
                      <span>{field.seekbarOptions?.min}</span>
                      <span>Current: {formData[field.name] || field.seekbarOptions?.max || 100}</span>
                      <span>{field.seekbarOptions?.max}</span>
                    </div>
                  </div>
                )
              }


              {
                field.type === "number" && (
                  <input
                    type="number"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "var(--dt-space-3)",
                      backgroundColor: "var(--dt-bg-tertiary)",
                      border: "1px solid var(--dt-border-primary)",
                      borderRadius: "var(--dt-radius-md)",
                      color: "var(--dt-text-primary)",
                      fontSize: "var(--dt-text-sm)",
                      minHeight: "42px"
                    }}
                  />
                )
              }
            </div>
          ))}

          {executeButtonVisible &&
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
                 opacity: isExecuting ? 0.6 : 1,
                 minHeight: "44px"
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
          }
        </form>
      </div>

      {/* Right Panel - Logs */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dt-space-4)",
        overflow: "hidden",
        minWidth: 0,
        minHeight: isMobile ? "360px" : 0
      }}>
        <TerminalOutput
          logs={logs}
          clearLogs={ clearLogs}
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
