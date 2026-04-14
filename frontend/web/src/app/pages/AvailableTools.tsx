import { useEffect, useState } from "react";
import { Filter, Download, Star, TrendingUp, Clock } from "lucide-react";
import { ToolCard } from "../components/ToolCard";
import CategoryManager from "../core/CategoryManager";
import DevToolManager from "../core/DevToolManager";
import type { DevTool } from "../types/DevTool";

export function AvailableTools() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  const categories = CategoryManager.getCategories();

  const sortOptions = [
    { id: "most-used", label: "Most Popular", icon: TrendingUp },
    { id: "recent", label: "Recently Added", icon: Clock }
  ];

  const [availableTools,setAvailableTools] = useState<DevTool[]>([]);
  useEffect(()=>{
    DevToolManager.setOnToolsUpdateCallback(()=>{
      setAvailableTools(DevToolManager.getToolsByCategoryId(selectedCategory))
    })
  })
  useEffect(()=>{
    setAvailableTools(DevToolManager.getToolsByCategoryId(selectedCategory))
  },[selectedCategory])

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--dt-space-8)" }}>
        <h1 style={{
          fontSize: "var(--dt-text-3xl)",
          fontWeight: "var(--dt-font-bold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-2) 0"
        }}>
          Plugin Marketplace
        </h1>
        <p style={{
          fontSize: "var(--dt-text-base)",
          color: "var(--dt-text-secondary)",
          margin: 0
        }}>
          Discover and install tools from the community
        </p>
      </div>

      {/* Filters and Sort */}
      <div style={{
        display: "flex",
        gap: "var(--dt-space-6)",
        marginBottom: "var(--dt-space-6)",
        paddingBottom: "var(--dt-space-6)",
        borderBottom: "1px solid var(--dt-border-primary)"
      }}>
        {/* Category Filter */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            marginBottom: "var(--dt-space-3)"
          }}>
            <Filter size={16} color="var(--dt-text-tertiary)" />
            <span style={{
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              color: "var(--dt-text-secondary)"
            }}>
              Category
            </span>
          </div>
          <div style={{
            display: "flex",
            gap: "var(--dt-space-2)",
            flexWrap: "wrap"
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: selectedCategory === cat.id 
                    ? "var(--dt-accent-primary)" 
                    : "var(--dt-bg-secondary)",
                  color: selectedCategory === cat.id 
                    ? "white" 
                    : "var(--dt-text-secondary)",
                  border: selectedCategory === cat.id 
                    ? "1px solid var(--dt-accent-primary)" 
                    : "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  transition: "all var(--dt-transition-fast)"
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
                  }
                }}
              >
                {cat.name}
                <span style={{
                  marginLeft: "var(--dt-space-2)",
                  opacity: 0.7,
                  fontSize: "var(--dt-text-xs)"
                }}>
                  ({DevToolManager.getToolCountByCategoryId(cat.id)})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div style={{ width: "240px" }}>
          <label style={{
            display: "block",
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-secondary)",
            marginBottom: "var(--dt-space-3)"
          }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-sm)",
              cursor: "pointer"
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        marginBottom: "var(--dt-space-6)",
        fontSize: "var(--dt-text-sm)",
        color: "var(--dt-text-tertiary)"
      }}>
        Showing {availableTools.length} tools
      </div>

      {/* Plugin Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "var(--dt-space-6)"
      }}>
        {availableTools.map((plugin) => (
          <ToolCard key={plugin.id} {...plugin} />
        ))}
      </div>

      {/* Empty State */}
      {availableTools.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "var(--dt-space-16)",
          color: "var(--dt-text-tertiary)"
        }}>
          <p style={{ fontSize: "var(--dt-text-lg)" }}>No plugins found in this category</p>
        </div>
      )}
    </div>
  );
}
