import { useMemo, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import { Link } from "react-router";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";

function LineNumberCopier() {
    const [inputText, setInputText] = useState("");
    const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

    const numberedLines = useMemo(() => {
        return inputText.split("\n").map((line, index) => ({
            number: index + 1,
            text: line
        }));
    }, [inputText]);

    const numberedOutput = useMemo(() => {
        return inputText
            .split("\n")
            .map((line, index) => `${index + 1} ${line}`)
            .join("\n");
    }, [inputText]);

    async function handleCopy() {
        await navigator.clipboard.writeText(numberedOutput);
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
    }

    return (
        <div style={{ padding: "var(--dt-space-8)" }}>
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
                        transition: "color var(--dt-transition-fast)"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--dt-accent-primary)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--dt-text-tertiary)";
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
            </div>

            <div style={{
                marginBottom: "var(--dt-space-8)",
                padding: "var(--dt-space-6)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)"
            }}>
                <div style={{
                    display: "inline-block",
                    padding: "var(--dt-space-1) var(--dt-space-3)",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid var(--dt-accent-primary)",
                    borderRadius: "var(--dt-radius-full)",
                    fontSize: "var(--dt-text-xs)",
                    fontWeight: "var(--dt-font-medium)",
                    color: "var(--dt-accent-primary)",
                    marginBottom: "var(--dt-space-3)"
                }}>
                    Utilities
                </div>

                <h1 style={{
                    fontSize: "var(--dt-text-3xl)",
                    fontWeight: "var(--dt-font-bold)",
                    color: "var(--dt-text-primary)",
                    margin: "0 0 var(--dt-space-2) 0"
                }}>
                    Line Number Copier
                </h1>

                <p style={{
                    fontSize: "var(--dt-text-base)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                }}>
                    Paste or type text on the left and get a live preview with line numbers on the right. Copy the formatted output in one click.
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--dt-space-6)"
            }}>
                <section style={{
                    backgroundColor: "var(--dt-bg-secondary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-lg)",
                    padding: "var(--dt-space-6)"
                }}>
                    <div style={{
                        marginBottom: "var(--dt-space-4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--dt-space-4)"
                    }}>
                        <h2 style={{
                            margin: 0,
                            color: "var(--dt-text-primary)",
                            fontSize: "var(--dt-text-xl)",
                            fontWeight: "var(--dt-font-semibold)"
                        }}>
                            Input
                        </h2>
                        <span style={{
                            fontSize: "var(--dt-text-xs)",
                            color: "var(--dt-text-tertiary)"
                        }}>
                            Each line is numbered live
                        </span>
                    </div>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type or paste text here..."
                        rows={16}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "var(--dt-space-4)",
                            backgroundColor: "var(--dt-bg-tertiary)",
                            border: "1px solid var(--dt-border-primary)",
                            borderRadius: "var(--dt-radius-md)",
                            color: "var(--dt-text-primary)",
                            fontSize: "var(--dt-text-sm)",
                            fontFamily: "var(--dt-font-mono)",
                            resize: "vertical",
                            outline: "none"
                        }}
                    />
                </section>

                <section style={{
                    backgroundColor: "var(--dt-bg-secondary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-lg)",
                    padding: "var(--dt-space-6)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100%"
                }}>
                    <div style={{
                        marginBottom: "var(--dt-space-4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--dt-space-4)"
                    }}>
                        <h2 style={{
                            margin: 0,
                            color: "var(--dt-text-primary)",
                            fontSize: "var(--dt-text-xl)",
                            fontWeight: "var(--dt-font-semibold)"
                        }}>
                            Output
                        </h2>

                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!numberedOutput}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--dt-space-2)",
                                padding: "var(--dt-space-2) var(--dt-space-4)",
                                backgroundColor: numberedOutput ? "var(--dt-accent-primary)" : "var(--dt-bg-tertiary)",
                                color: numberedOutput ? "#fff" : "var(--dt-text-tertiary)",
                                border: "none",
                                borderRadius: "var(--dt-radius-md)",
                                fontSize: "var(--dt-text-sm)",
                                fontWeight: "var(--dt-font-medium)",
                                cursor: numberedOutput ? "pointer" : "not-allowed"
                            }}
                        >
                            <Copy size={14} />
                            {copyState === "copied" ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        backgroundColor: "var(--dt-bg-tertiary)",
                        border: "1px solid var(--dt-border-primary)",
                        borderRadius: "var(--dt-radius-md)",
                        padding: "var(--dt-space-4)",
                        overflow: "auto"
                    }}>
                        {inputText ? (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "var(--dt-space-1)",
                                fontFamily: "var(--dt-font-mono)",
                                fontSize: "var(--dt-text-sm)",
                                color: "var(--dt-text-primary)"
                            }}>
                                {numberedLines.map((line) => (
                                    <div
                                        key={line.number}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "3rem 1fr",
                                            gap: "var(--dt-space-3)",
                                            alignItems: "start",
                                            padding: "var(--dt-space-1) 0"
                                        }}
                                    >
                                        <span style={{
                                            color: "var(--dt-text-tertiary)",
                                            textAlign: "right",
                                            userSelect: "none"
                                        }}>
                                            {line.number}
                                        </span>
                                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                            {line.text || " "}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--dt-text-tertiary)",
                                fontSize: "var(--dt-text-sm)"
                            }}>
                                Your numbered output will appear here.
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
    description: "Live text area preview that adds line numbers to each line and lets you copy the formatted result.",
    id: "line-number-copier-tool",
    name: "Line Number Copier",
    tool: LineNumberCopier
});

console.log("Line number copier tool imported");