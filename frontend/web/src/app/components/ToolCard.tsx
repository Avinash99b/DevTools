import { Download, Star, GitBranch, ExternalLink, Settings, Play } from "lucide-react";
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

  const category = CategoryManager.getCategoryById(categoryId)
  return (
    <div style={{
      backgroundColor: "var(--dt-bg-secondary)",
      border: "1px solid var(--dt-border-primary)",
      borderRadius: "var(--dt-radius-lg)",
      padding: "var(--dt-space-5)",
      transition: "all var(--dt-transition-base)",
      cursor: "pointer",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
        e.currentTarget.style.borderColor = "var(--dt-border-secondary)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--dt-shadow-lg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
        e.currentTarget.style.borderColor = "var(--dt-border-primary)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--dt-space-3)" }}>
        <div style={{ flex: 1 }}>
          <Link
            to={`/tool/${id}`}
            style={{
              fontSize: "var(--dt-text-lg)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              textDecoration: "none",
              display: "block",
              marginBottom: "var(--dt-space-1)"
            }}
          >
            {name}
          </Link>
          <p style={{
            fontSize: "var(--dt-text-xs)",
            color: "var(--dt-text-tertiary)",
            margin: 0
          }}>
            by {author}
          </p>
        </div>

        {/* {installed && (
          <div style={{
            backgroundColor: enabled ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
            border: `1px solid ${enabled ? "var(--dt-status-success)" : "var(--dt-status-idle)"}`,
            borderRadius: "var(--dt-radius-full)",
            padding: "var(--dt-space-1) var(--dt-space-3)",
            fontSize: "var(--dt-text-xs)",
            fontWeight: "var(--dt-font-medium)",
            color: enabled ? "var(--dt-status-success)" : "var(--dt-status-idle)"
          }}>
            {enabled ? "Enabled" : "Disabled"}
          </div>
        )} */}
      </div>

      {/* Category Badge */}
      <div style={{
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
        marginBottom: "var(--dt-space-4)"
      }}>
        {category?.name}
      </div>

      {/* Description */}
      <p style={{
        fontSize: "var(--dt-text-sm)",
        color: "var(--dt-text-secondary)",
        lineHeight: "var(--dt-leading-relaxed)",
        margin: "0 0 var(--dt-space-4) 0",
        flex: 1
      }}>
        {description}
      </p>


      {/* Actions */}
      <div style={{
        display: "flex",
        gap: "var(--dt-space-2)",
        marginTop: "var(--dt-space-4)"
      }}>

        <>
          <Link
            to={`/tool/${id}`}
            style={{
              flex: 1,
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
              transition: "all var(--dt-transition-fast)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--dt-accent-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--dt-accent-primary)";
            }}
          >
            <Play size={16} />
            Run
          </Link>
          <button style={{
            padding: "var(--dt-space-2) var(--dt-space-3)",
            backgroundColor: "var(--dt-bg-tertiary)",
            color: "var(--dt-text-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-md)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Settings size={16} />
          </button>
        </>

      </div>
    </div>
  );
}
