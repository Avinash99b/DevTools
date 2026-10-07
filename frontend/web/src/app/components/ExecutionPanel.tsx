import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Play, Loader2, AlertTriangle } from "lucide-react";
import { TerminalOutput, type LogEntry } from "./TerminalOutput";
import type { DevToolOutput } from "../types/DevToolOutput";
import { OutputCard } from "./OutputCard";
import { useIsMobile } from "./ui/use-mobile";

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
  onExecute: (data: Record<string, any>) => void | Promise<void>;
  output?: DevToolOutput | DevToolOutput[];
  clearLogs?: () => void;
  isRealtime?: boolean;
  progress?: number;
  error?: string;
}

interface FileItem {
  file: File;
  preview: string;
  selected: boolean;
}

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "var(--dt-space-3)",
  backgroundColor: "var(--dt-bg-tertiary)",
  border: "1px solid var(--dt-border-primary)",
  borderRadius: "var(--dt-radius-md)",
  color: "var(--dt-text-primary)",
  fontSize: "var(--dt-text-sm)",
  minHeight: "42px",
};

export function ExecutionPanel({ executeButtonVisible = true, isRemoteAvailable, isExecuting, logs, fields, onExecute, output, clearLogs, isRealtime, progress, error }: ExecutionPanelProps) {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [executionMode, setExecutionMode] = useState<"local" | "remote">("local");
  const [fileState, setFileState] = useState<Record<string, FileItem[]>>({});
  const [dragField, setDragField] = useState<string | null>(null);

  const formDataRef = useRef(formData);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Release every object URL created for previews when the panel unmounts.
  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const applyField = (name: string, value: any, realtime = true) => {
    const next = { ...formDataRef.current, [name]: value };
    formDataRef.current = next;
    setFormData(next);
    if (realtime && isRealtime) onExecute(next);
  };

  const handleFieldChange = (name: string, value: any) => applyField(name, value);

  // Keep fileState and the submitted form value derived from one source so they
  // can never disagree after selecting, toggling or removing files.
  const setFiles = (name: string, items: FileItem[]) => {
    setFileState((prev) => ({ ...prev, [name]: items }));
    applyField(name, items.filter((i) => i.selected).map((i) => i.file));
  };

  const toggleSelect = (fieldName: string, index: number) => {
    const items = (fileState[fieldName] || []).map((item, i) => (i === index ? { ...item, selected: !item.selected } : item));
    setFiles(fieldName, items);
  };

  const removeFile = (fieldName: string, index: number) => {
    const current = fileState[fieldName] || [];
    const removed = current[index];
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
      objectUrlsRef.current.delete(removed.preview);
    }
    setFiles(fieldName, current.filter((_, i) => i !== index));
  };

  const addFiles = (name: string, files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const newFiles: FileItem[] = Array.from(files).map((file) => {
      const preview = URL.createObjectURL(file);
      objectUrlsRef.current.add(preview);
      return { file, preview, selected: true };
    });
    setFiles(name, [...(fileState[name] || []), ...newFiles]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Defer into a promise chain so synchronous throws from onExecute are also
    // captured (tools surface their own error state).
    void Promise.resolve().then(() => onExecute(formDataRef.current)).catch(() => { /* handled by tool */ });
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
            <div role="group" aria-label="Execution mode" style={{
              display: "flex",
              gap: "var(--dt-space-2)",
              backgroundColor: "var(--dt-bg-tertiary)",
              padding: "var(--dt-space-1)",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)",
              flexWrap: "wrap"
            }}>
              <button
                type="button"
                aria-pressed={executionMode === "local"}
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
                type="button"
                aria-pressed={executionMode === "remote"}
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

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-5)" }}>
          {fields.map((field) => {
            const fieldId = `field-${field.name}`;
            return (
            <div key={field.name}>
              {field.type !== "button" && (
                <label htmlFor={fieldId} style={{
                  display: "block",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  color: "var(--dt-text-primary)",
                  marginBottom: "var(--dt-space-2)"
                }}>
                  {field.label}
                  {field.required && (
                    <span aria-hidden="true" style={{ color: "var(--dt-accent-error)", marginLeft: "4px" }}>*</span>
                  )}
                </label>
              )}

              {field.description && (
                <p id={`${fieldId}-desc`} style={{
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
                    onClick={() => field.onClick && field.onClick(formDataRef.current)}
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
                  id={fieldId}
                  aria-describedby={field.description ? `${fieldId}-desc` : undefined}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  style={{ ...inputStyle, fontFamily: "var(--dt-font-sans)", resize: "vertical", minHeight: "132px" }}
                />
              ) : field.type === "select" ? (
                <select
                  id={fieldId}
                  aria-describedby={field.description ? `${fieldId}-desc` : undefined}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                  style={inputStyle}
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
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragField(field.name); }}
                      onDragLeave={() => setDragField((current) => (current === field.name ? null : current))}
                      onDrop={(e) => { e.preventDefault(); setDragField(null); addFiles(field.name, e.dataTransfer.files); }}
                      style={{
                        padding: "var(--dt-space-6)",
                        background: "linear-gradient(145deg, var(--dt-bg-tertiary), var(--dt-bg-secondary))",
                        border: dragField === field.name ? "2px dashed var(--dt-accent-primary)" : "2px dashed var(--dt-border-secondary)",
                        borderRadius: "var(--dt-radius-lg)",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}>
                      <input
                        type="file"
                        multiple={field.fileOptions?.multiple}
                        accept={field.fileOptions?.accept}
                        onChange={(e) => { addFiles(field.name, e.target.files); e.target.value = ""; }}
                        style={{ display: "none" }}
                        id={fieldId}
                      />

                      <label htmlFor={fieldId} style={{
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
                          <div key={`${item.file.name}-${index}`} style={{
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
                                alt={`Preview of ${item.file.name}`}
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
                                aria-label={`Preview of ${item.file.name}`}
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
                                fontSize: "12px",
                                wordBreak: "break-all",
                                padding: "4px"
                              }}>
                                {item.file.name}
                              </div>
                            )}

                            {/* Select Toggle */}
                            <button
                              type="button"
                              aria-label={item.selected ? `Deselect ${item.file.name}` : `Select ${item.file.name}`}
                              aria-pressed={item.selected}
                              onClick={() => toggleSelect(field.name, index)}
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                width: 24,
                                height: 24,
                                padding: 0,
                                borderRadius: "50%",
                                border: "none",
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
                            </button>

                            {/* Remove Button */}
                            <button
                              type="button"
                              aria-label={`Remove ${item.file.name}`}
                              onClick={() => removeFile(field.name, index)}
                              style={{
                                position: "absolute",
                                top: 6,
                                left: 6,
                                width: 24,
                                height: 24,
                                padding: 0,
                                borderRadius: "50%",
                                border: "none",
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
                            </button>
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
                      id={fieldId}
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
                    id={fieldId}
                    aria-describedby={field.description ? `${fieldId}-desc` : undefined}
                    type="number"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={inputStyle}
                  />
                )
              }
              {
                field.type === "checkbox" && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id={fieldId}
                      type="checkbox"
                      checked={!!formData[field.name]}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      style={{
                         width: "16px",
                         height: "16px",
                         cursor: "pointer",
                         accentColor: "var(--dt-accent-primary)"
                      }}
                    />
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                      {field.placeholder || "Enable"}
                    </span>
                  </div>
                )
              }
              {
                field.type === "text" && (
                   <input
                    id={fieldId}
                    aria-describedby={field.description ? `${fieldId}-desc` : undefined}
                    type="text"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={inputStyle}
                  />
                )
              }

              {
                field.type === "radio" && field.options && (
                  <fieldset style={{ border: "none", padding: 0, margin: 0, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {field.options.map(option => (
                      <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={field.name}
                          value={option}
                          checked={formData[field.name] === option}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          style={{ accentColor: "var(--dt-accent-primary)" }}
                        />
                        <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )
              }
            </div>
          );})}

          {error && (
            <div role="alert" style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
              padding: "var(--dt-space-3)",
              border: "1px solid var(--dt-accent-error)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-accent-error)",
              fontSize: "var(--dt-text-sm)"
            }}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {isExecuting && typeof progress === "number" && progress > 0 && (
            <div aria-label={`Progress ${progress}%`}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", marginBottom: 4 }}>
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 8, backgroundColor: "var(--dt-bg-tertiary)", borderRadius: "var(--dt-radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "var(--dt-accent-primary)", transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}

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
                  <Loader2 size={20} aria-hidden="true" style={{ animation: "spin 1s linear infinite" }} />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={20} aria-hidden="true" />
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
        {output ? (
          Array.isArray(output) ? (
            output.map((out, idx) => (
              <OutputCard key={idx} output={out} />
            ))
          ) : (
            <OutputCard output={output} />
          )
        ) : null}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}