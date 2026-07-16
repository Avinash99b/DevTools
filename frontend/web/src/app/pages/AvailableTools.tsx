import { useMemo, useState } from "react";
import { Filter, TrendingUp, Clock, Search } from "lucide-react";
import { ToolCard } from "../components/ToolCard";
import CategoryManager from "../core/CategoryManager";
import DevToolManager from "../core/DevToolManager";

export function AvailableTools() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("most-used");
  const [query, setQuery] = useState("");

  const categories = CategoryManager.getCategories();

  const sortOptions = [
    { id: "most-used", label: "Most Popular", icon: TrendingUp },
    { id: "recent", label: "Recently Added", icon: Clock },
  ];

  const availableTools = useMemo(() => {
    const tools = DevToolManager.getToolsByCategoryId(selectedCategory).filter((tool) =>
      `${tool.name} ${tool.description} ${tool.author}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );

    if (sortBy === "recent") {
      return [...tools].reverse();
    }

    return tools;
  }, [selectedCategory, sortBy, query]);

  return (
    <div
      style={{
        padding: "clamp(var(--dt-space-4), 2.6vw, var(--dt-space-8))",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "var(--dt-space-8)" }}>
        <h1
          style={{
            fontSize: "clamp(var(--dt-text-2xl), 4vw, var(--dt-text-3xl))",
            fontWeight: "var(--dt-font-bold)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-2) 0",
          }}
        >
          Plugin Marketplace
        </h1>
        <p
          style={{
            fontSize: "var(--dt-text-base)",
            color: "var(--dt-text-secondary)",
            margin: 0,
          }}
        >
          Discover and launch tools from the DevTools workspace.
        </p>
      </div>

      <div
        style={{
          marginBottom: "var(--dt-space-5)",
          position: "relative",
          maxWidth: "560px",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            top: "50%",
            left: "var(--dt-space-3)",
            transform: "translateY(-50%)",
            color: "var(--dt-text-tertiary)",
          }}
        />
        <input
          type="search"
          aria-label="Search available tools"
          placeholder="Search tools by name, description, or author"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            minHeight: "44px",
            borderRadius: "var(--dt-radius-md)",
            border: "1px solid var(--dt-border-primary)",
            backgroundColor: "var(--dt-bg-secondary)",
            color: "var(--dt-text-primary)",
            fontSize: "var(--dt-text-sm)",
            padding: "var(--dt-space-2) var(--dt-space-3) var(--dt-space-2) var(--dt-space-10)",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "var(--dt-space-5)",
          marginBottom: "var(--dt-space-6)",
          paddingBottom: "var(--dt-space-6)",
          borderBottom: "1px solid var(--dt-border-primary)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
              marginBottom: "var(--dt-space-3)",
            }}
          >
            <Filter size={16} color="var(--dt-text-tertiary)" />
            <span
              style={{
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-secondary)",
              }}
            >
              Category
            </span>
          </div>
          <div style={{ display: "flex", gap: "var(--dt-space-2)", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  minHeight: "40px",
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor:
                    selectedCategory === cat.id
                      ? "var(--dt-accent-primary)"
                      : "var(--dt-bg-secondary)",
                  color:
                    selectedCategory === cat.id ? "white" : "var(--dt-text-secondary)",
                  border:
                    selectedCategory === cat.id
                      ? "1px solid var(--dt-accent-primary)"
                      : "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  transition: "all var(--dt-transition-fast)",
                }}
              >
                {cat.name}
                <span
                  style={{
                    marginLeft: "var(--dt-space-2)",
                    opacity: 0.75,
                    fontSize: "var(--dt-text-xs)",
                  }}
                >
                  ({DevToolManager.getToolCountByCategoryId(cat.id)})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              color: "var(--dt-text-secondary)",
              marginBottom: "var(--dt-space-3)",
            }}
          >
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={{
              width: "100%",
              minHeight: "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-sm)",
              cursor: "pointer",
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

      <div
        style={{
          marginBottom: "var(--dt-space-5)",
          fontSize: "var(--dt-text-sm)",
          color: "var(--dt-text-tertiary)",
        }}
      >
        Showing {availableTools.length} tools
      </div>

      {availableTools.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: "var(--dt-space-5)",
          }}
        >
          {availableTools.map((plugin) => (
            <ToolCard key={plugin.id} {...plugin} />
          ))}
        </div>
      ) : (
        <div
          role="status"
          style={{
            textAlign: "center",
            padding: "var(--dt-space-12)",
            color: "var(--dt-text-tertiary)",
            border: "1px dashed var(--dt-border-secondary)",
            borderRadius: "var(--dt-radius-lg)",
            backgroundColor: "var(--dt-bg-secondary)",
          }}
        >
          <p style={{ fontSize: "var(--dt-text-lg)", margin: 0 }}>
            No matching tools found
          </p>
          <p style={{ margin: "var(--dt-space-2) 0 0", fontSize: "var(--dt-text-sm)" }}>
            Try another category or adjust your search query.
          </p>
        </div>
      )}
    </div>
  );
}
