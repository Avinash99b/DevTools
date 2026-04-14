import { useState, useEffect, useRef } from "react";
import { Terminal, Copy, Download, Trash2, Maximize2 } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

interface TerminalOutputProps {
  logs?: LogEntry[];
  title?: string;
  height?: string;
}

const levelColors = {
  info: "var(--dt-terminal-blue)",
  success: "var(--dt-terminal-green)",
  warning: "var(--dt-terminal-yellow)",
  error: "var(--dt-terminal-red)"
};

const levelPrefixes = {
  info: "[INFO]",
  success: "[SUCCESS]",
  warning: "[WARN]",
  error: "[ERROR]"
};

export function TerminalOutput({ 
  logs = [], 
  title = "Logs",
  height = "400px"
}: TerminalOutputProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const copyToClipboard = () => {
    const text = logs.map(log => 
      `${log.timestamp} ${levelPrefixes[log.level]} ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  const clearLogs = () => {
    // In real implementation, this would clear the logs
    console.log("Clear logs");
  };

  return (
    <div style={{
      backgroundColor: "var(--dt-bg-secondary)",
      border: "1px solid var(--dt-border-primary)",
      borderRadius: "var(--dt-radius-lg)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--dt-space-3) var(--dt-space-4)",
        backgroundColor: "var(--dt-bg-tertiary)",
        borderBottom: "1px solid var(--dt-border-primary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <Terminal size={16} color="var(--dt-accent-primary)" />
          <span style={{
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)"
          }}>
            {title}
          </span>
          {logs.length > 0 && (
            <span style={{
              fontSize: "var(--dt-text-xs)",
              color: "var(--dt-text-tertiary)",
              padding: "var(--dt-space-1) var(--dt-space-2)",
              backgroundColor: "var(--dt-bg-primary)",
              borderRadius: "var(--dt-radius-sm)"
            }}>
              {logs.length} lines
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: "var(--dt-space-1) var(--dt-space-2)",
              backgroundColor: "transparent",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-sm)",
              color: "var(--dt-text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              fontSize: "var(--dt-text-xs)"
            }}
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={clearLogs}
            style={{
              padding: "var(--dt-space-1) var(--dt-space-2)",
              backgroundColor: "transparent",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-sm)",
              color: "var(--dt-text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              fontSize: "var(--dt-text-xs)"
            }}
            title="Clear logs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={outputRef}
        style={{
          height,
          overflowY: "auto",
          backgroundColor: "var(--dt-bg-primary)",
          padding: "var(--dt-space-4)",
          fontFamily: "var(--dt-font-mono)",
          fontSize: "var(--dt-text-sm)",
          lineHeight: "var(--dt-leading-relaxed)"
        }}
      >
        {logs.length === 0 ? (
          <div style={{
            color: "var(--dt-text-muted)",
            fontStyle: "italic",
            textAlign: "center",
            paddingTop: "var(--dt-space-8)"
          }}>
            No output yet. Run a tool to see results here.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: "var(--dt-space-1)" }}>
              <span style={{ color: "var(--dt-text-muted)" }}>{log.timestamp}</span>
              {" "}
              <span style={{ 
                color: levelColors[log.level],
                fontWeight: "var(--dt-font-medium)"
              }}>
                {levelPrefixes[log.level]}
              </span>
              {" "}
              <span style={{ color: "var(--dt-text-secondary)" }}>{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--dt-space-2) var(--dt-space-4)",
        backgroundColor: "var(--dt-bg-tertiary)",
        borderTop: "1px solid var(--dt-border-primary)",
        fontSize: "var(--dt-text-xs)",
        color: "var(--dt-text-muted)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-4)" }}>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "var(--dt-space-2)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Auto-scroll
          </label>
        </div>
        <div>
          UTF-8 | LF
        </div>
      </div>
    </div>
  );
}
