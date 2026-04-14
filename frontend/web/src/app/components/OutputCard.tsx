import { useState, useRef } from "react";
import { Terminal, Copy, Download, Maximize2 } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";

import type { DevToolOutput } from "../types/DevToolOutput";

interface TerminalOutputProps {
  output: DevToolOutput;
}

export function OutputCard({ output }: TerminalOutputProps) {
  const [copied, setCopied] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    if (output.type !== "code") return;
    const text =
      typeof output.data === "string"
        ? output.data
        : JSON.stringify(output.data, null, 2);

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const highlightCode = () => {
    if (!codeRef.current) return;
    Prism.highlightElement(codeRef.current);
  };

  const renderContent = () => {
    switch (output.type) {
      case "code": {
        const code =
          typeof output.data === "string"
            ? output.data
            : JSON.stringify(output.data, null, 2);

        setTimeout(highlightCode, 0);

        return (
          <div style={{ position: "relative" }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
              }}
            >
              <Copy size={14} />
              <span style={{ fontSize: 10 }}>
                {copied ? "Copied" : ""}
              </span>
            </button>

            <pre
              style={{
                margin: 0,
                padding: "var(--dt-space-4)",
                overflowX: "auto",
              }}
            >
              <code ref={codeRef} className="language-js">
                {code}
              </code>
            </pre>
          </div>
        );
      }

      case "image":
        return (
          <div style={{ padding: "var(--dt-space-4)", position: "relative" }}>
            <img
              src={output.data}
              alt="output"
              style={{
                maxWidth: "100%",
                borderRadius: "var(--dt-radius-md)",
                cursor: "zoom-in",
              }}
              onClick={() => setZoomImage(output.data)}
            />

            {/* Zoom button */}
            <button
              onClick={() => setZoomImage(output.data)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        );

      case "video":
        return (
          <div style={{ padding: "var(--dt-space-4)" }}>
            <video
              src={output.data}
              controls
              style={{
                width: "100%",
                borderRadius: "var(--dt-radius-md)",
              }}
            />
          </div>
        );

      case "file":
        return (
          <div
            style={{
              padding: "var(--dt-space-4)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ color: "var(--dt-text-primary)" }}>
              {output.data?.name || "File"}
            </div>

            <div style={{ fontSize: 12, color: "var(--dt-text-muted)" }}>
              Type: {output.data?.type || "unknown"}
            </div>

            <div style={{ fontSize: 12, color: "var(--dt-text-muted)" }}>
              Size: {formatFileSize(output.data?.size)}
            </div>

            <a
              href={output.data?.url || output.data}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--dt-accent-primary)",
                textDecoration: "none",
                marginTop: 6,
              }}
            >
              <Download size={14} />
              Download
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--dt-space-3) var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-tertiary)",
            borderBottom: "1px solid var(--dt-border-primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
            <Terminal size={16} color="var(--dt-accent-primary)" />
            <span
              style={{
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
              }}
            >
              Output
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>{renderContent()}</div>

        {/* Footer */}
        <div
          style={{
            padding: "var(--dt-space-2) var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-tertiary)",
            borderTop: "1px solid var(--dt-border-primary)",
            fontSize: "var(--dt-text-xs)",
            color: "var(--dt-text-muted)",
          }}
        >
          {output.type.toUpperCase()}
        </div>
      </div>

      {/* 🔍 Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            cursor: "zoom-out",
          }}
        >
          <img
            src={zoomImage}
            alt="zoom"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 10,
            }}
          />
        </div>
      )}
    </>
  );
}