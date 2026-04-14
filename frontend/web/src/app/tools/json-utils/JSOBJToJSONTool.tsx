import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ExecutionPanel } from "../../components/ExecutionPanel";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";


function JsonTool() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    function jsObjectToJsonString(jsText: string) {
        const obj = eval(`(${jsText})`);
        return JSON.stringify(obj);
    }

    const [output, setOutput] = useState<DevToolOutput | undefined>();
    function execute(data: Record<string, any>) {
        setIsExecuting(true)

        setLogs((val) => [...val, { level: "info", message: "Starting Conversion", timestamp: new Date().toLocaleTimeString() }])

        const str = data["text"]

        try {

            const json = jsObjectToJsonString(str)
            setOutput({data:json,type:"code"})

            setLogs((val) => [...val, { level: "success", message: "Conversion Completed", timestamp: new Date().toLocaleTimeString() }])
        } catch (e) {
            setLogs((val) => [...val, { level: "error", message: "Conversion Failed", timestamp: new Date().toLocaleTimeString() }])
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
                    Utilities
                </div>

                <h1 style={{
                    fontSize: "var(--dt-text-3xl)",
                    fontWeight: "var(--dt-font-bold)",
                    color: "var(--dt-text-primary)",
                    margin: "0 0 var(--dt-space-2) 0"
                }}>
                    JSON Tool
                </h1>

                <p style={{
                    fontSize: "var(--dt-text-base)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                }}>
                    This is an all in JSON tool for handling json data.
                </p>

            </div>

            {/* Execution Panel */}
            <ExecutionPanel
                isExecuting={isExecuting}
                toolName={'json-tool'}
                fields={[{
                    name: "text",
                    type: "textarea",
                    required: true,
                    label: "Text"
                }]}
                logs={logs}
                onExecute={execute}
                output={output}
            />
        </div>
    );
}

//Filename: JsonTool.tsx
registerDevTool({
    author: "Avinash",
    categoryId: "json-utils",
    description: "Contains all Utilities for json",
    id: "json-tool",
    name: "JSON Utilities",
    tool: JsonTool
})

console.log("JSon tool imported")
