import { useState } from "react";
import { Pause, X, RotateCcw } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";

interface Task {
  id: string;
  toolName: string;
  status: "running" | "success" | "error" | "queued";
  progress: number;
  startTime: string;
  duration: string;
  input: string;
  output?: string;
}

export function TaskManager() {
  const [tasks] = useState<Task[]>([
    {
      id: "task-001",
      toolName: "Image Compressor",
      status: "running",
      progress: 67,
      startTime: "14:32:15",
      duration: "00:02:34",
      input: "photo-album.zip (145 MB)"
    },
    {
      id: "task-002",
      toolName: "JSON Formatter",
      status: "success",
      progress: 100,
      startTime: "14:28:42",
      duration: "00:00:03",
      input: "api-response.json",
      output: "formatted-output.json"
    },
    {
      id: "task-003",
      toolName: "APK Analyzer",
      status: "error",
      progress: 45,
      startTime: "14:25:11",
      duration: "00:01:22",
      input: "app-release.apk",
      output: "Error: Invalid APK signature"
    },
    {
      id: "task-004",
      toolName: "Video Transcoder",
      status: "queued",
      progress: 0,
      startTime: "-",
      duration: "-",
      input: "movie.mp4 (2.3 GB)"
    }
  ]);

  const [filter, setFilter] = useState<string>("all");

  const stats = [
    { 
      label: "Running", 
      value: tasks.filter(t => t.status === "running").length,
      color: "var(--dt-status-running)"
    },
    { 
      label: "Completed", 
      value: tasks.filter(t => t.status === "success").length,
      color: "var(--dt-status-success)"
    },
    { 
      label: "Failed", 
      value: tasks.filter(t => t.status === "error").length,
      color: "var(--dt-status-error)"
    },
    { 
      label: "Queued", 
      value: tasks.filter(t => t.status === "queued").length,
      color: "var(--dt-text-tertiary)"
    }
  ];

  const filteredTasks = filter === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filter);

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
          Task Manager
        </h1>
        <p style={{
          fontSize: "var(--dt-text-base)",
          color: "var(--dt-text-secondary)",
          margin: 0
        }}>
          Monitor and manage your tool execution tasks
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "var(--dt-space-4)",
        marginBottom: "var(--dt-space-8)"
      }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "var(--dt-space-5)",
              backgroundColor: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-lg)"
            }}
          >
            <div style={{
              fontSize: "var(--dt-text-xs)",
              color: "var(--dt-text-tertiary)",
              marginBottom: "var(--dt-space-2)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: "var(--dt-text-3xl)",
              fontWeight: "var(--dt-font-bold)",
              color: stat.color
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "var(--dt-space-2)",
        marginBottom: "var(--dt-space-6)",
        paddingBottom: "var(--dt-space-6)",
        borderBottom: "1px solid var(--dt-border-primary)"
      }}>
        {["all", "running", "success", "error", "queued"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "var(--dt-space-2) var(--dt-space-4)",
              backgroundColor: filter === status 
                ? "var(--dt-accent-primary)" 
                : "var(--dt-bg-secondary)",
              color: filter === status 
                ? "white" 
                : "var(--dt-text-secondary)",
              border: filter === status 
                ? "1px solid var(--dt-accent-primary)" 
                : "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all var(--dt-transition-fast)"
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "var(--dt-space-5)",
              backgroundColor: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-lg)",
              transition: "all var(--dt-transition-base)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
              e.currentTarget.style.borderColor = "var(--dt-border-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
              e.currentTarget.style.borderColor = "var(--dt-border-primary)";
            }}
          >
            {/* Task Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--dt-space-4)"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)", marginBottom: "var(--dt-space-2)" }}>
                  <h3 style={{
                    fontSize: "var(--dt-text-lg)",
                    fontWeight: "var(--dt-font-semibold)",
                    color: "var(--dt-text-primary)",
                    margin: 0
                  }}>
                    {task.toolName}
                  </h3>
                  <StatusBadge status={task.status} size="sm" />
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-tertiary)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  ID: {task.id}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
                {task.status === "running" && (
                  <button style={{
                    padding: "var(--dt-space-2)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }} title="Pause">
                    <Pause size={16} />
                  </button>
                )}
                {task.status === "error" && (
                  <button style={{
                    padding: "var(--dt-space-2)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }} title="Retry">
                    <RotateCcw size={16} />
                  </button>
                )}
                <button style={{
                  padding: "var(--dt-space-2)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  color: "var(--dt-status-error)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }} title="Cancel">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Task Details */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--dt-space-4)",
              marginBottom: task.status === "running" ? "var(--dt-space-4)" : 0,
              padding: "var(--dt-space-4)",
              backgroundColor: "var(--dt-bg-tertiary)",
              borderRadius: "var(--dt-radius-md)"
            }}>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  Input
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {task.input}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  Start Time
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {task.startTime}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  Duration
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {task.duration}
                </div>
              </div>
            </div>

            {/* Progress Bar (for running tasks) */}
            {task.status === "running" && (
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "var(--dt-space-2)",
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)"
                }}>
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div style={{
                  height: "8px",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  borderRadius: "var(--dt-radius-full)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${task.progress}%`,
                    backgroundColor: "var(--dt-accent-primary)",
                    transition: "width 0.3s ease",
                    borderRadius: "var(--dt-radius-full)"
                  }} />
                </div>
              </div>
            )}

            {/* Output (for completed/failed tasks) */}
            {task.output && (
              <div style={{
                marginTop: "var(--dt-space-4)",
                padding: "var(--dt-space-3)",
                backgroundColor: "var(--dt-bg-primary)",
                borderRadius: "var(--dt-radius-md)",
                fontSize: "var(--dt-text-sm)",
                fontFamily: "var(--dt-font-mono)",
                color: task.status === "error" ? "var(--dt-status-error)" : "var(--dt-status-success)"
              }}>
                {task.output}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "var(--dt-space-16)",
          color: "var(--dt-text-tertiary)"
        }}>
          <p style={{ fontSize: "var(--dt-text-lg)" }}>No {filter !== "all" ? filter : ""} tasks found</p>
        </div>
      )}
    </div>
  );
}
