import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Download, Image as ImageIcon, FileCode2 } from "lucide-react";
import { Link } from "react-router";
import mermaid from "mermaid";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { useIsMobile } from "../../components/ui/use-mobile";

type TemplateId =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "gantt"
  | "journey"
  | "mindmap"
  | "timeline";

const TEMPLATES: Record<TemplateId, { label: string; source: string }> = {
  flowchart: {
    label: "Flowchart",
    source: `flowchart TD
  Start([Start]) --> Input[User input]
  Input --> Validate{Valid?}
  Validate -- Yes --> Process[Process request]
  Validate -- No --> Reject[Show error]
  Process --> End([Done])
  Reject --> End`,
  },
  sequence: {
    label: "Sequence",
    source: `sequenceDiagram
  actor User
  participant UI
  participant API
  User->>UI: Submit form
  UI->>API: POST /submit
  API-->>UI: 200 OK
  UI-->>User: Success state`,
  },
  class: {
    label: "Class",
    source: `classDiagram
  class DevTool {
    +id: string
    +name: string
    +run()
  }
  class ToolRegistry {
    +registerDevTool(devTool)
    +getAllTools()
  }
  ToolRegistry --> DevTool`,
  },
  state: {
    label: "State",
    source: `stateDiagram-v2
  [*] --> Idle
  Idle --> Editing: User types
  Editing --> Rendering: Debounce elapsed
  Rendering --> Success: Diagram generated
  Rendering --> Error: Parse failed
  Success --> Editing
  Error --> Editing`,
  },
  er: {
    label: "ER",
    source: `erDiagram
  USER ||--o{ PROJECT : owns
  PROJECT ||--o{ TOOL : contains
  TOOL ||--o{ EXECUTION : runs

  USER {
    string id
    string name
  }
  PROJECT {
    string id
    string title
  }
  TOOL {
    string id
    string category
  }`,
  },
  gantt: {
    label: "Gantt",
    source: `gantt
  title DevTool Release Plan
  dateFormat  YYYY-MM-DD
  section Core
  Architecture review      :done, a1, 2026-07-01, 2d
  Mermaid editor build     :active, a2, 2026-07-03, 4d
  section UX
  Mobile polishing         :a3, after a2, 3d
  Validation & QA          :a4, after a3, 2d`,
  },
  journey: {
    label: "Journey",
    source: `journey
  title Developer journey
  section Discover
    Open DevTools app: 5: Developer
    Search a utility: 4: Developer
  section Build
    Pick Mermaid editor: 5: Developer
    Generate and export diagram: 5: Developer
  section Share
    Paste in docs/PR: 4: Developer`,
  },
  mindmap: {
    label: "Mindmap",
    source: `mindmap
  root((DevTools))
    Editors
      Mermaid Live Editor
      JSON Tooling
    Utilities
      Base64
      Line Number Copier
    UX
      Mobile Layout
      Accessibility
      Smooth Transitions`,
  },
  timeline: {
    label: "Timeline",
    source: `timeline
  title Feature Rollout
  2026-07-01 : Architecture analysis
  2026-07-04 : Mermaid editor implementation
  2026-07-06 : Mobile responsive polish
  2026-07-08 : QA and release`,
  },
};

const DEFAULT_TEMPLATE: TemplateId = "flowchart";

function MermaidLiveEditor() {
  const isMobile = useIsMobile();
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [source, setSource] = useState(TEMPLATES[DEFAULT_TEMPLATE].source);
  const [svgMarkup, setSvgMarkup] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const renderRef = useRef(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((value) => value + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const currentTheme = useMemo(() => {
    const isLightClassEnabled =
      document.documentElement.classList.contains("light-theme") ||
      document.body.classList.contains("light-theme");

    if (isLightClassEnabled) {
      return "default";
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "default"
      : "dark";
  }, [themeVersion]);

  useEffect(() => {
    const renderNumber = ++renderRef.current;
    setIsRendering(true);

    const timeout = window.setTimeout(async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: currentTheme,
          securityLevel: "strict",
          fontFamily: "inherit",
        });

        const { svg } = await mermaid.render(`mermaid-live-${renderNumber}`, source);

        if (renderNumber !== renderRef.current) {
          return;
        }

        setSvgMarkup(svg);
        setError(null);
      } catch (renderError) {
        if (renderNumber !== renderRef.current) {
          return;
        }

        const message =
          renderError instanceof Error
            ? renderError.message
            : "Unable to render the Mermaid diagram.";

        setError(message);
        setSvgMarkup("");
      } finally {
        if (renderNumber === renderRef.current) {
          setIsRendering(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [source, currentTheme, refreshToken]);

  const copySource = async () => {
    await navigator.clipboard.writeText(source);
    setCopiedSource(true);
    window.setTimeout(() => setCopiedSource(false), 1500);
  };

  const copySvg = async () => {
    if (!svgMarkup) return;
    await navigator.clipboard.writeText(svgMarkup);
    setCopiedSvg(true);
    window.setTimeout(() => setCopiedSvg(false), 1500);
  };

  const downloadSvg = () => {
    if (!svgMarkup) return;

    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mermaid-diagram-${Date.now()}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPng = async () => {
    if (!svgMarkup) return;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgMarkup, "image/svg+xml");
    const svgElement = svgDoc.documentElement;
    const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number) ?? [];
    const width = Number(svgElement.getAttribute("width")) || viewBox[2] || 1200;
    const height = Number(svgElement.getAttribute("height")) || viewBox[3] || 800;

    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to load SVG for PNG export."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");

    if (!context) {
      URL.revokeObjectURL(url);
      throw new Error("Unable to access canvas context for PNG export.");
    }

    context.scale(scale, scale);
    const backgroundColor = getComputedStyle(document.body).getPropertyValue("--dt-bg-secondary").trim() || "#111827";
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const pngUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = `mermaid-diagram-${Date.now()}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const loadTemplate = (id: TemplateId) => {
    setTemplateId(id);
    setSource(TEMPLATES[id].source);
  };

  return (
    <div style={{ padding: "clamp(var(--dt-space-4), 2.6vw, var(--dt-space-8))" }}>
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
            transition: "color var(--dt-transition-fast)",
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <div
        style={{
          marginBottom: "var(--dt-space-6)",
          padding: "clamp(var(--dt-space-4), 2.2vw, var(--dt-space-6))",
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "var(--dt-space-1) var(--dt-space-3)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            border: "1px solid var(--dt-accent-primary)",
            borderRadius: "var(--dt-radius-full)",
            fontSize: "var(--dt-text-xs)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-accent-primary)",
            marginBottom: "var(--dt-space-3)",
          }}
        >
          Mermaid Live Editor
        </div>

        <h1
          style={{
            fontSize: "clamp(var(--dt-text-2xl), 4vw, var(--dt-text-3xl))",
            fontWeight: "var(--dt-font-bold)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-2) 0",
          }}
        >
          Mermaid Live Editor
        </h1>

        <p style={{ fontSize: "var(--dt-text-base)", color: "var(--dt-text-secondary)", margin: 0 }}>
          Build Mermaid diagrams with live debounced rendering, templates, and one-click copy/export actions.
        </p>
      </div>

      <section
        style={{
          marginBottom: "var(--dt-space-6)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "var(--dt-space-2)",
        }}
      >
        {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => loadTemplate(id)}
            style={{
              minHeight: "42px",
              borderRadius: "var(--dt-radius-md)",
              border:
                templateId === id
                  ? "1px solid var(--dt-accent-primary)"
                  : "1px solid var(--dt-border-primary)",
              backgroundColor:
                templateId === id
                  ? "rgba(99, 102, 241, 0.14)"
                  : "var(--dt-bg-secondary)",
              color:
                templateId === id
                  ? "var(--dt-accent-primary)"
                  : "var(--dt-text-secondary)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer",
              transition: "all var(--dt-transition-fast)",
            }}
          >
            {TEMPLATES[id].label}
          </button>
        ))}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "var(--dt-space-6)",
          alignItems: "start",
        }}
      >
        <section
          style={{
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            padding: "clamp(var(--dt-space-4), 2vw, var(--dt-space-6))",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--dt-space-3)",
              marginBottom: "var(--dt-space-4)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "var(--dt-text-xl)", color: "var(--dt-text-primary)" }}>
              Mermaid Source
            </h2>
            <button
              type="button"
              onClick={copySource}
              aria-label="Copy Mermaid source"
              style={{
                minHeight: "40px",
                padding: "var(--dt-space-2) var(--dt-space-4)",
                borderRadius: "var(--dt-radius-md)",
                border: "1px solid var(--dt-border-primary)",
                backgroundColor: "var(--dt-bg-tertiary)",
                color: "var(--dt-text-primary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--dt-space-2)",
              }}
            >
              <Copy size={15} />
              {copiedSource ? "Copied" : "Copy Source"}
            </button>
          </div>

          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                setRefreshToken((value) => value + 1);
              }
            }}
            placeholder="Write Mermaid diagram source..."
            rows={20}
            aria-label="Mermaid diagram source"
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: isMobile ? "280px" : "520px",
              padding: "var(--dt-space-4)",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)",
              backgroundColor: "var(--dt-bg-tertiary)",
              color: "var(--dt-text-primary)",
              fontFamily: "var(--dt-font-mono)",
              fontSize: "var(--dt-text-sm)",
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />

          <p style={{ margin: "var(--dt-space-2) 0 0", color: "var(--dt-text-tertiary)", fontSize: "var(--dt-text-xs)" }}>
            Live updates are debounced by 350ms. Shortcut: Ctrl/Cmd + Enter to force refresh.
          </p>
        </section>

        <section
          style={{
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            padding: "clamp(var(--dt-space-4), 2vw, var(--dt-space-6))",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "var(--dt-space-2)",
              marginBottom: "var(--dt-space-4)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "var(--dt-text-xl)", color: "var(--dt-text-primary)" }}>
              Live Preview
            </h2>
            <span
              role="status"
              style={{
                fontSize: "var(--dt-text-xs)",
                color: isRendering ? "var(--dt-accent-warning)" : "var(--dt-status-success)",
              }}
            >
              {isRendering ? "Rendering…" : "Up to date"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--dt-space-2)",
              flexWrap: "wrap",
              marginBottom: "var(--dt-space-4)",
            }}
          >
            <button
              type="button"
              onClick={copySvg}
              disabled={!svgMarkup}
              aria-label="Copy generated SVG"
              style={{
                minHeight: "40px",
                padding: "var(--dt-space-2) var(--dt-space-4)",
                borderRadius: "var(--dt-radius-md)",
                border: "1px solid var(--dt-border-primary)",
                backgroundColor: svgMarkup ? "var(--dt-bg-tertiary)" : "var(--dt-bg-primary)",
                color: svgMarkup ? "var(--dt-text-primary)" : "var(--dt-text-tertiary)",
                cursor: svgMarkup ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--dt-space-2)",
              }}
            >
              <FileCode2 size={15} />
              {copiedSvg ? "Copied" : "Copy SVG"}
            </button>

            <button
              type="button"
              onClick={downloadSvg}
              disabled={!svgMarkup}
              aria-label="Download SVG"
              style={{
                minHeight: "40px",
                padding: "var(--dt-space-2) var(--dt-space-4)",
                borderRadius: "var(--dt-radius-md)",
                border: "1px solid var(--dt-border-primary)",
                backgroundColor: svgMarkup ? "var(--dt-bg-tertiary)" : "var(--dt-bg-primary)",
                color: svgMarkup ? "var(--dt-text-primary)" : "var(--dt-text-tertiary)",
                cursor: svgMarkup ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--dt-space-2)",
              }}
            >
              <Download size={15} />
              Download SVG
            </button>

            <button
              type="button"
              onClick={() => {
                downloadPng().catch((downloadError) => {
                  setError(
                    downloadError instanceof Error
                      ? downloadError.message
                      : "Unable to export PNG.",
                  );
                });
              }}
              disabled={!svgMarkup}
              aria-label="Download PNG"
              style={{
                minHeight: "40px",
                padding: "var(--dt-space-2) var(--dt-space-4)",
                borderRadius: "var(--dt-radius-md)",
                border: "1px solid var(--dt-border-primary)",
                backgroundColor: svgMarkup ? "var(--dt-accent-primary)" : "var(--dt-bg-primary)",
                color: svgMarkup ? "#fff" : "var(--dt-text-tertiary)",
                cursor: svgMarkup ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--dt-space-2)",
              }}
            >
              <ImageIcon size={15} />
              Download PNG
            </button>
          </div>

          <div
            style={{
              minHeight: isMobile ? "260px" : "520px",
              maxWidth: "100%",
              overflow: "auto",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)",
              backgroundColor: "var(--dt-bg-tertiary)",
              padding: "var(--dt-space-4)",
              boxSizing: "border-box",
            }}
          >
            {error ? (
              <div
                role="alert"
                style={{
                  border: "1px solid var(--dt-accent-error)",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderRadius: "var(--dt-radius-md)",
                  padding: "var(--dt-space-4)",
                  color: "var(--dt-text-primary)",
                  fontSize: "var(--dt-text-sm)",
                  lineHeight: "var(--dt-leading-relaxed)",
                }}
              >
                <strong>Render error:</strong>
                <div style={{ marginTop: "var(--dt-space-2)", whiteSpace: "pre-wrap" }}>{error}</div>
              </div>
            ) : svgMarkup ? (
              <div
                aria-live="polite"
                style={{ maxWidth: "100%" }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  minHeight: "220px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--dt-text-tertiary)",
                  textAlign: "center",
                  padding: "var(--dt-space-4)",
                }}
              >
                Start typing Mermaid source to preview your diagram.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

registerDevTool({
  author: "Avinash",
  categoryId: ToolCategories.DEV_UTILS,
  description:
    "Create Mermaid diagrams with live debounced rendering, templates, and SVG/PNG export.",
  id: "mermaid-live-editor",
  name: "Mermaid Live Editor",
  tool: MermaidLiveEditor,
});

console.log("Mermaid Live Editor tool imported");
