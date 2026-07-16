import { Settings, Play } from "lucide-react";
import { Link } from "react-router";
import CategoryManager from "../core/CategoryManager";
import type { DevTool } from "../types/DevTool";

export function ToolCard({
  id,
  name,
  description,
  categoryId,
  author,
}: DevTool) {
  const category = CategoryManager.getCategoryById(categoryId);

  return (
    <article
      style={{
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)",
        padding: "clamp(var(--dt-space-4), 2vw, var(--dt-space-5))",
        transition: "all var(--dt-transition-base)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "var(--dt-space-3)",
          gap: "var(--dt-space-2)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            to={`/tool/${id}`}
            style={{
              fontSize: "var(--dt-text-lg)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              textDecoration: "none",
              display: "block",
              marginBottom: "var(--dt-space-1)",
              wordBreak: "break-word",
            }}
          >
            {name}
          </Link>
          <p
            style={{
              fontSize: "var(--dt-text-xs)",
              color: "var(--dt-text-tertiary)",
              margin: 0,
            }}
          >
            by {author}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--dt-space-2)",
          padding: "var(--dt-space-1) var(--dt-space-3)",
          backgroundColor: `${category?.color}20`,
          border: `1px solid ${category?.color}`,
          borderRadius: "var(--dt-radius-full)",
          fontSize: "var(--dt-text-xs)",
          fontWeight: "var(--dt-font-medium)",
          color: category?.color,
          width: "fit-content",
          marginBottom: "var(--dt-space-4)",
        }}
      >
        {category?.name}
      </div>

      <p
        style={{
          fontSize: "var(--dt-text-sm)",
          color: "var(--dt-text-secondary)",
          lineHeight: "var(--dt-leading-relaxed)",
          margin: "0 0 var(--dt-space-4) 0",
          flex: 1,
          overflowWrap: "anywhere",
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: "flex",
          gap: "var(--dt-space-2)",
          marginTop: "var(--dt-space-4)",
        }}
      >
        <Link
          to={`/tool/${id}`}
          aria-label={`Run ${name}`}
          style={{
            flex: 1,
            minHeight: "42px",
            padding: "var(--dt-space-2) var(--dt-space-4)",
            backgroundColor: "var(--dt-accent-primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--dt-radius-md)",
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-medium)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--dt-space-2)",
            textDecoration: "none",
            transition: "all var(--dt-transition-fast)",
          }}
        >
          <Play size={16} />
          Run
        </Link>
        <button
          type="button"
          aria-label={`Open settings for ${name}`}
          style={{
            minWidth: "42px",
            minHeight: "42px",
            padding: "var(--dt-space-2) var(--dt-space-3)",
            backgroundColor: "var(--dt-bg-tertiary)",
            color: "var(--dt-text-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-md)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </article>
  );
}
