import { useSyncExternalStore } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { ToolCategory } from "../types/ToolCategory";
import CategoryManager from "../core/CategoryManager";
import DevToolManager from "../core/DevToolManager";
import { ToolCard } from "../components/ToolCard";

const RECENT_KEY = "devtools:recent-tools";
const MAX_RECENT = 4;

function getRecentTools() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        return ids.map((id) => DevToolManager.getToolById(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
    } catch {
        return [];
    }
}

export function HomePage() {
    const categories: ToolCategory[] = CategoryManager.getCategories();
    const allTools = useSyncExternalStore(
        (cb) => DevToolManager.subscribe(cb),
        () => DevToolManager.getSnapshot(),
    );
    const recentTools = getRecentTools().slice(0, MAX_RECENT);

    return (
        <div
            style={{
                padding: "clamp(var(--dt-space-4), 2.4vw, var(--dt-space-8))",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div style={{ marginBottom: "var(--dt-space-8)" }}>
                <h2
                    style={{
                        fontSize: "clamp(var(--dt-text-xl), 3vw, var(--dt-text-2xl))",
                        fontWeight: "var(--dt-font-semibold)",
                        color: "var(--dt-text-primary)",
                        margin: "0 0 var(--dt-space-5) 0",
                    }}
                >
                    Tool Categories
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                        gap: "var(--dt-space-4)",
                    }}
                >
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <Link
                                key={category.name}
                                to={`/available-tools/${category.id}`}
                                style={{
                                    padding: "clamp(var(--dt-space-4), 2vw, var(--dt-space-6))",
                                    backgroundColor: "var(--dt-bg-secondary)",
                                    border: "1px solid var(--dt-border-primary)",
                                    borderRadius: "var(--dt-radius-lg)",
                                    textDecoration: "none",
                                    transition: "all var(--dt-transition-base)",
                                    cursor: "pointer",
                                    minHeight: "168px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        backgroundColor: `${category.color}20`,
                                        border: `2px solid ${category.color}`,
                                        borderRadius: "var(--dt-radius-lg)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "var(--dt-space-4)",
                                    }}
                                >
                                    <Icon size={24} color={category.color} />
                                </div>
                                <h3
                                    style={{
                                        fontSize: "var(--dt-text-lg)",
                                        fontWeight: "var(--dt-font-semibold)",
                                        color: "var(--dt-text-primary)",
                                        margin: "0 0 var(--dt-space-2) 0",
                                    }}
                                >
                                    {category.name}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "var(--dt-text-sm)",
                                        color: "var(--dt-text-secondary)",
                                        margin: "0 0 var(--dt-space-3) 0",
                                        lineHeight: "var(--dt-leading-relaxed)",
                                    }}
                                >
                                    {category.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--dt-space-3)",
                        marginBottom: "var(--dt-space-5)",
                        flexWrap: "wrap",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "clamp(var(--dt-text-xl), 3vw, var(--dt-text-2xl))",
                            fontWeight: "var(--dt-font-semibold)",
                            color: "var(--dt-text-primary)",
                            margin: 0,
                        }}
                    >
                        {recentTools.length > 0 ? "Recently Used Tools" : "Featured Tools"}
                    </h2>
                    <Link
                        to="/available-tools"
                        style={{
                            color: "var(--dt-accent-primary)",
                            textDecoration: "none",
                            fontSize: "var(--dt-text-sm)",
                            fontWeight: "var(--dt-font-medium)",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--dt-space-1)",
                        }}
                    >
                        View All
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {allTools.length > 0 ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                            gap: "var(--dt-space-5)",
                        }}
                    >
                        {(recentTools.length > 0 ? recentTools : allTools.slice(0, MAX_RECENT)).map((tool) => (
                            <ToolCard key={tool.id} {...tool} />
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            backgroundColor: "var(--dt-bg-secondary)",
                            border: "1px dashed var(--dt-border-secondary)",
                            borderRadius: "var(--dt-radius-lg)",
                            padding: "var(--dt-space-8)",
                            textAlign: "center",
                            color: "var(--dt-text-secondary)",
                        }}
                    >
                        <p style={{ margin: 0, fontSize: "var(--dt-text-base)" }}>
                            No tools registered yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}