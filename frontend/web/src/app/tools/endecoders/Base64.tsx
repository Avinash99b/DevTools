import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ExecutionPanel } from "../../components/ExecutionPanel";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import CategoryManager, { ToolCategories } from "../../core/CategoryManager";


function Base64EnDecoder() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [output, setOutput] = useState<DevToolOutput | undefined>();

        function encodeToBase64(str: string) {
            return btoa(str);
        }

        function decodeFromBase64(str: string) {
            return atob(str);
        }

    function execute(data: Record<string, any>) {
        setIsExecuting(true)

        const str = data["text"]
        const action = data["action"]

        try {
            let result = ""
            if (action === "encode") {
                result = encodeToBase64(str)
            } else {
                result = decodeFromBase64(str)
            }
            setOutput({ data: result, type: "code" })

        } catch (e) {
            setLogs((val) => [...val, { level: "error", message: "Execution Failed", timestamp: new Date().toLocaleTimeString() }])
        }
        setIsExecuting(false)
    }

    return (
        <div style={{ padding: "var(--dt-space-8)" }}>
            {/* Breadcrumb */}
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

            {/* Tool Header */}
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
                    {CategoryManager.getCategoryById(ToolCategories.ENDECODERS)?.name}
                </div>

                <h1 style={{
                    fontSize: "var(--dt-text-3xl)",
                    fontWeight: "var(--dt-font-bold)",
                    color: "var(--dt-text-primary)",
                    margin: "0 0 var(--dt-space-2) 0"
                }}>
                    Base64 Encoder/Decoder
                </h1>

                <p style={{
                    fontSize: "var(--dt-text-base)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                }}>
                    Encode or decode Base64 strings with ease. Perfect for developers, testers, and anyone working with encoded data.
                </p>

            </div>

            {/* Execution Panel */}
            <ExecutionPanel
                isRemoteAvailable={false}
                isExecuting={isExecuting}
                toolName={'base64-tool'}
                fields={[
                    {
                        name: "text",
                        type: "textarea",
                        required: true,
                        label: "Base64 String",
                        placeholder: "Enter text to encode/decode..."
                    },
                    {
                        name:"encode-btn",
                        type: "button",
                        label: "Encode",
                        onClick: (data) => execute({ ...data, action: "encode" })
                    },
                    {
                        name:"decode-btn",
                        type: "button",
                        label: "Decode",
                        onClick: (data) => execute({ ...data, action: "decode" })
                    }
                    
                ]}
                executeButtonVisible={false}
                logs={logs}
                onExecute={execute}
                output={output}
            />
        </div>
    );
}

//Filename: Base64Tool.tsx
registerDevTool({
    author: "Avinash",
    categoryId: ToolCategories.ENDECODERS,
    description: "Contains utilities for encoding and decoding Base64 strings. Whether you need to encode data for transmission or decode received data, this tool has got you covered.",
    id: "base64-tool",
    name: "Base64 Encoder/Decoder",
    tool: Base64EnDecoder
})

console.log("Base64 tool imported")
