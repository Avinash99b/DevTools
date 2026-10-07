import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal, Copy, Download, X } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";

import type { DevToolOutput } from "../types/DevToolOutput";
import { sanitizeHtml } from "../core/sanitize";

import JSZip from "jszip";

interface TerminalOutputProps {
  output: DevToolOutput;
}

/** Creates an object URL for a Blob and revokes it automatically. */
function useObjectUrl(value: Blob | string | undefined): string | undefined {
  // Object URL creation is a cheap side effect derived from the value, so it is
  // computed during render and revoked by the effect below when it changes.
  const url = useMemo(() => {
    if (!value) return undefined;
    return typeof value === "string" ? value : URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    if (!url || !url.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}

/** Creates object URLs for a mixed list of Blobs/strings, revoking on change. */
function useObjectUrls(values: (Blob | string)[]): string[] {
  const urls = useMemo(
    () => values.map((v) => (typeof v === "string" ? v : URL.createObjectURL(v))),
    [values]
  );

  useEffect(() => {
    return () => urls.forEach((url) => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); });
  }, [urls]);

  return urls;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const stripControlChars = (value: string) =>
  Array.from(value).filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127).join("");

const safeFileName = (name: string, fallback: string) => {
  const base = stripControlChars(name.split(/[\\/]/).pop() ?? "").trim();
  return base || fallback;
};

const triggerDownload = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Fetches a string reference (remote URL or data URL) into a Blob. */
const resolveBlob = async (src: string): Promise<Blob> => {
  if (src.startsWith("data:")) {
    const res = await fetch(src);
    return res.blob();
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch ${src}`);
  return res.blob();
};

export function OutputCard({ output }: TerminalOutputProps) {
  const [copied, setCopied] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const codeRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const code = useMemo(
    () => (output.type === "code" ? (typeof output.data === "string" ? output.data : JSON.stringify(output.data, null, 2)) : ""),
    [output]
  );

  // Highlight after render (previously scheduled during render, causing leaks).
  useEffect(() => {
    if (output.type === "code" && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, output.type]);

  // Escape closes the zoom dialog.
  useEffect(() => {
    if (!zoomImage) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomImage(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomImage]);

  const handleCopy = async () => {
    if (output.type !== "code") return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const imageItems = useMemo(
    () => (output.type === "images" ? (Array.isArray(output.data) ? output.data : [output.data]) : []),
    [output]
  );
  const videoItems = useMemo(
    () => (output.type === "videos" ? (Array.isArray(output.data) ? output.data : [output.data]) : []),
    [output]
  );
  const imageUrls = useObjectUrls(imageItems as (Blob | string)[]);
  const videoUrls = useObjectUrls(videoItems as (Blob | string)[]);
  const singleFileUrl = useObjectUrl(output.type === "file" ? output.data : undefined);

  const downloadImage = useCallback(async (imgSrc: string | Blob, idx: number) => {
    try {
      const blob = typeof imgSrc === "string" ? await resolveBlob(imgSrc) : imgSrc;
      triggerDownload(blob, `image-${idx + 1}.png`);
    } catch (err) {
      console.error("Download failed", err);
    }
  }, []);

  const downloadAll = useCallback(async () => {
    const files = Array.isArray(output.data) ? output.data : [output.data];
    const zip = new JSZip();
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx] as string | Blob & { name?: string };
      try {
        const blob = typeof file === "string" ? await resolveBlob(file) : file;
        const name = typeof file === "string"
          ? safeFileName(file.split("?")[0], `file-${idx + 1}`)
          : safeFileName((file as File).name || "", `file-${idx + 1}`);
        zip.file(name, blob);
      } catch (err) {
        console.error("Skipping file in ZIP", err);
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    triggerDownload(content, "files.zip");
  }, [output.data]);

  const renderContent = () => {
    switch (output.type) {
      case "code": {
        return (
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Copy code"
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
              <span style={{ fontSize: 10 }}>{copied ? "Copied" : ""}</span>
            </button>

            <pre style={{ margin: 0, padding: "var(--dt-space-4)", width: "100%", overflowX: "auto", overflowY: "hidden", boxSizing: "border-box", maxWidth: "100%" }}>
              <code ref={codeRef} className="language-js" style={{ display: "inline-block", minWidth: "100%" }}>
                {code}
              </code>
            </pre>
          </div>
        );
      }

      case "images":
        return (
          <div style={{ padding: "var(--dt-space-4)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {imageItems.map((imgSrc, idx) => {
              const src = imageUrls[idx];
              if (!src) return null;
              return (
                <div key={idx} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <img
                    src={src}
                    alt={`Output image ${idx + 1}`}
                    style={{ width: "min(100%, 220px)", height: "auto", maxHeight: "220px", objectFit: "cover", borderRadius: "var(--dt-radius-md)", cursor: "zoom-in" }}
                    onClick={() => setZoomImage(src)}
                  />
                  <button
                    type="button"
                    aria-label={`Download image ${idx + 1}`}
                    onClick={() => downloadImage(imgSrc, idx)}
                    style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, padding: 0, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
                  >
                    ⬇
                  </button>
                  <div style={{ fontSize: 12, color: "var(--dt-text-muted)" }}>
                    Size: {formatFileSize(typeof imgSrc === "string" ? undefined : (imgSrc as Blob)?.size)}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "videos":
        return (
          <div style={{ padding: "var(--dt-space-4)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {videoItems.map((_videoSrc, idx) => (
              <video key={idx} src={videoUrls[idx]} controls style={{ width: "min(100%, 420px)", maxWidth: "100%", height: "auto", borderRadius: "var(--dt-radius-md)" }} />
            ))}
          </div>
        );

      case "file":
        return (
          <div style={{ padding: "var(--dt-space-4)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "var(--dt-text-primary)" }}>{output.data?.name || "File"}</div>
            <div style={{ fontSize: 12, color: "var(--dt-text-muted)" }}>Type: {output.data?.type || "unknown"}</div>
            <div style={{ fontSize: 12, color: "var(--dt-text-muted)" }}>Size: {formatFileSize(output.data?.size)}</div>
            {singleFileUrl && (
              <a href={singleFileUrl} download rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--dt-accent-primary)", textDecoration: "none", marginTop: 6 }}>
                <Download size={14} />
                Download
              </a>
            )}
          </div>
        );

      case "html":
        return (
          <div
            style={{ padding: "var(--dt-space-4)", backgroundColor: "white", color: "black", borderRadius: "var(--dt-radius-md)" }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(output.data) }}
          />
        );

      case "remoteFile":
        return (
          <div style={{ padding: "var(--dt-space-4)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)", wordBreak: "break-all" }}>
              {output.data.label}
            </div>
            {output.data.meta?.map((line, idx) => (
              <div key={idx} style={{ fontSize: 12, color: "var(--dt-text-muted)", wordBreak: "break-all" }}>{line}</div>
            ))}
            <a
              href={output.data.href}
              download
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--dt-accent-primary)", textDecoration: "none", marginTop: 6 }}
            >
              <Download size={14} aria-hidden="true" />
              Download file
            </a>
          </div>
        );

      case "text":
        return (
          <div style={{ padding: "var(--dt-space-4)" }}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{output.data}</pre>
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
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--dt-space-3) var(--dt-space-4)", backgroundColor: "var(--dt-bg-tertiary)", borderBottom: "1px solid var(--dt-border-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
            <Terminal size={16} color="var(--dt-accent-primary)" aria-hidden="true" />
            <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-text-primary)" }}>
              {output.title ? output.title : "Output"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>{renderContent()}</div>

        {/* Footer */}
        <div style={{ padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "var(--dt-bg-tertiary)", borderTop: "1px solid var(--dt-border-primary)", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)" }}>
          {output.type.toUpperCase()}

          {(output.type === "files" || output.type === "images") && (
            <button
              type="button"
              onClick={downloadAll}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, color: "var(--dt-accent-primary)", cursor: "pointer", marginLeft: 16, fontSize: "var(--dt-text-xs)" }}
            >
              <Download size={14} aria-hidden="true" />
              Download All
            </button>
          )}
        </div>
      </div>

      {/* 🔍 Image Zoom Modal */}
      {zoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setZoomImage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, cursor: "zoom-out" }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close image preview"
            onClick={(e) => { e.stopPropagation(); setZoomImage(null); }}
            style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} />
          </button>
          <img src={zoomImage} alt="Zoomed output" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} />
        </div>
      )}
    </>
  );
}