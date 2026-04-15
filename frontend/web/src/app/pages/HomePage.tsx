import { Link } from "react-router";
import { 
  ArrowRight,
} from "lucide-react";
import type { ToolCategory } from "../types/ToolCategory";
import CategoryManager from "../core/CategoryManager";

export function HomePage() {
  const categories:ToolCategory[] = CategoryManager.getCategories();


  return (
    <div style={{ padding: "var(--dt-space-8)" }}>      

      {/* Categories */}
      <div style={{ marginBottom: "var(--dt-space-8)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Tool Categories
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--dt-space-4)"
        }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                to="/available-tools"
                style={{
                  padding: "var(--dt-space-6)",
                  backgroundColor: "var(--dt-bg-secondary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-lg)",
                  textDecoration: "none",
                  transition: "all var(--dt-transition-base)",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
                  e.currentTarget.style.borderColor = category.color;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--dt-shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--dt-border-primary)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: `${category.color}20`,
                  border: `2px solid ${category.color}`,
                  borderRadius: "var(--dt-radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--dt-space-4)"
                }}>
                  <Icon size={24} color={category.color} />
                </div>
                <h3 style={{
                  fontSize: "var(--dt-text-lg)",
                  fontWeight: "var(--dt-font-semibold)",
                  color: "var(--dt-text-primary)",
                  margin: "0 0 var(--dt-space-2) 0"
                }}>
                  {category.name}
                </h3>
                <p style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)",
                  margin: "0 0 var(--dt-space-3) 0",
                  lineHeight: "var(--dt-leading-relaxed)"
                }}>
                  {category.description}
                </p>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)"
                }}>
                  {/* {category.count} tools available */}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Installed Tools */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--dt-space-6)"
        }}>
          <h2 style={{
            fontSize: "var(--dt-text-2xl)",
            fontWeight: "var(--dt-font-semibold)",
            color: "var(--dt-text-primary)",
            margin: 0
          }}>
            Recently Used Tools
          </h2>
          <Link
            to="/marketplace"
            style={{
              color: "var(--dt-accent-primary)",
              textDecoration: "none",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-1)"
            }}
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>
        {/* Recently Used Tools Menu */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "var(--dt-space-6)"
        }}>
         
        </div>
      </div>
    </div>
  );
}
