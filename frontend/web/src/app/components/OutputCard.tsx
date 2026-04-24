import { useState, useRef } from "react";
import { Terminal, Copy, Download } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";

import type { DevToolOutput } from "../types/DevToolOutput";

import JSZip from "jszip";

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
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                boxSizing: "border-box",
              }}
            >
              <code
                ref={codeRef}
                className="language-js"
                style={{
                  display: "inline-block",
                  minWidth: "100%",       // ensures it fills container but can expand
                }}
              >
                {code}
              </code>
            </pre>
          </div>
        );
      }

      case "images":
        return (
          <div
            style={{
              padding: "var(--dt-space-4)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            }}
          >
            {(Array.isArray(output.data) ? output.data : [output.data]).map(
              (imgSrc, idx) => {
                const src =
                  typeof imgSrc === "string"
                    ? imgSrc
                    : URL.createObjectURL(imgSrc);

                const handleDownload = async () => {
                  try {
                    let blob: Blob;

                    if (typeof imgSrc === "string") {
                      const res = await fetch(imgSrc);
                      blob = await res.blob();
                    } else {
                      blob = imgSrc;
                    }

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `image-${idx}.png`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("Download failed", err);
                  }
                };

                return (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {/* IMAGE */}
                    <img
                      src={src}
                      alt={`output-${idx}`}
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: "var(--dt-radius-md)",
                        cursor: "zoom-in"
                      }}
                      onClick={() => setZoomImage(src)}
                    />

                    {/* DOWNLOAD BUTTON */}
                    <div
                      onClick={handleDownload}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      ⬇
                    </div>

                    {/* FILE SIZE */}
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--dt-text-muted)"
                      }}
                    >
                      Size:{" "}
                      {formatFileSize(
                        typeof imgSrc === "string" ? undefined : imgSrc?.size
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        );

      case "videos":
        return (
          <div style={{ padding: "var(--dt-space-4)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Array.isArray(output.data) ? output.data : [output.data]).map((videoSrc, idx) => (
              <video
                key={idx}
                src={typeof videoSrc === "string" ? videoSrc : URL.createObjectURL(videoSrc)}
                controls
                style={{
                  width: 300,
                  height: 200,
                  borderRadius: "var(--dt-radius-md)",
                }}
              />
            ))}
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
              href={URL.createObjectURL(output.data)}
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
          overflowY: "scroll",
          overflowX: "hidden",
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

          {/* Download Zip Button */}
          {(output.type === "files" || output.type === "images") && (
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--dt-accent-primary)",
                textDecoration: "none",
                marginLeft: 16,
              }}
              onClick={(e) => {
                e.preventDefault();
                // Implement ZIP download logic here

                const files = Array.isArray(output.data) ? output.data : [output.data];
                const zip = new JSZip();
                files.forEach((file, idx) => {
                  const fileName = typeof file === "string" ? `file-${idx + 1}${file.substring(file.lastIndexOf("."))}` : file.name || `file-${idx + 1}`;
                  zip.file(fileName, file);
                });
                zip.generateAsync({ type: "blob" }).then((content) => {
                  const url = URL.createObjectURL(content);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "files.zip";
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }}
            >
              <Download size={14} />
              Download All
            </a>
          )}
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