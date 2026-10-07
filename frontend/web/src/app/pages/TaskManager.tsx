import { useCallback, useEffect, useMemo, useState } from "react";
import { X, RotateCcw, RefreshCw, Loader2 } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { listJobs, cancelJob, retryJob, type JobResponse } from "../core/jobs";

type TaskStatus = "running" | "success" | "error" | "queued";

const mapStatus = (status: string): TaskStatus => {
  switch (status) {
    case "running": return "running";
    case "pending": return "queued";
    case "completed": return "success";
    case "error": return "error";
    case "cancelled": return "error";
    default: return "queued";
  }
};

const formatTime = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return "-";
  const date = typeof value === "number" ? new Date(value) : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export function TaskManager() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState<string | undefined>();

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(undefined);
      const data = await listJobs(100);
      setJobs(data.jobs ?? []);
    } catch (e: any) {
      if (!silent) setError(e?.response?.data?.error || e?.message || "Failed to load tasks.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load runs async inside the effect (no synchronous setState here).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async load, not a synchronous setState
    void load();
    // Poll while the page is open so running jobs update live.
    const timer = setInterval(() => { void load(true); }, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (id: string, action: "cancel" | "retry") => {
    setBusy(id);
    try {
      if (action === "cancel") await cancelJob(id);
      else await retryJob(id);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Action failed.");
    } finally {
      setBusy(undefined);
    }
  };

  const tasks = useMemo(() => jobs.map((job) => ({
    id: job.jobId || job.id || "unknown",
    toolName: job.toolId && job.toolId.length > 3 ? job.toolId : "Tool",
    status: mapStatus(job.status),
    rawStatus: job.status,
    progress: job.progress ?? (job.status === "completed" ? 100 : 0),
    startTime: formatTime(job.createdAt),
    duration: formatTime(job.updatedAt),
    output: job.error || (job.status === "completed" ? "Completed successfully" : undefined),
  })), [jobs]);

  const stats = useMemo(() => [
    { label: "Running", value: tasks.filter(t => t.status === "running").length, color: "var(--dt-status-running)" },
    { label: "Completed", value: tasks.filter(t => t.status === "success").length, color: "var(--dt-status-success)" },
    { label: "Failed", value: tasks.filter(t => t.status === "error").length, color: "var(--dt-status-error)" },
    { label: "Queued", value: tasks.filter(t => t.status === "queued").length, color: "var(--dt-text-tertiary)" },
  ], [tasks]);

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--dt-space-8)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)", margin: "0 0 var(--dt-space-2) 0" }}>
            Task Manager
          </h1>
          <p style={{ fontSize: "var(--dt-text-base)", color: "var(--dt-text-secondary)", margin: 0 }}>
            Monitor background server tasks. Runs that execute synchronously in the browser do not appear here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-text-secondary)", cursor: "pointer" }}
        >
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: "var(--dt-space-6)", padding: "var(--dt-space-3)", border: "1px solid var(--dt-accent-error)", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-accent-error)" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--dt-space-4)", marginBottom: "var(--dt-space-8)" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ padding: "var(--dt-space-5)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)" }}>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", marginBottom: "var(--dt-space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div role="group" aria-label="Filter tasks by status" style={{ display: "flex", gap: "var(--dt-space-2)", marginBottom: "var(--dt-space-6)", paddingBottom: "var(--dt-space-6)", borderBottom: "1px solid var(--dt-border-primary)", flexWrap: "wrap" }}>
        {["all", "running", "success", "error", "queued"].map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
            style={{
              padding: "var(--dt-space-2) var(--dt-space-4)",
              backgroundColor: filter === status ? "var(--dt-accent-primary)" : "var(--dt-bg-secondary)",
              color: filter === status ? "white" : "var(--dt-text-secondary)",
              border: filter === status ? "1px solid var(--dt-accent-primary)" : "1px solid var(--dt-border-primary)",
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

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--dt-text-tertiary)" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} aria-hidden="true" /> Loading tasks...
        </div>
      )}

      {/* Task List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            style={{ padding: "var(--dt-space-5)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)" }}
          >
            {/* Task Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--dt-space-4)", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)", marginBottom: "var(--dt-space-2)", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", margin: 0, wordBreak: "break-all" }}>
                    {task.toolName}
                  </h3>
                  <StatusBadge status={task.status} size="sm" />
                </div>
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-tertiary)", fontFamily: "var(--dt-font-mono)", wordBreak: "break-all" }}>
                  ID: {task.id}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
                {task.status === "error" && (
                  <button
                    type="button"
                    aria-label="Retry task"
                    title="Retry"
                    disabled={busy === task.id}
                    onClick={() => act(task.id, "retry")}
                    style={{ padding: "var(--dt-space-2)", backgroundColor: "var(--dt-bg-tertiary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                {(task.rawStatus === "running" || task.rawStatus === "pending") && (
                  <button
                    type="button"
                    aria-label="Cancel task"
                    title="Cancel"
                    disabled={busy === task.id}
                    onClick={() => act(task.id, "cancel")}
                    style={{ padding: "var(--dt-space-2)", backgroundColor: "var(--dt-bg-tertiary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-status-error)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Task Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--dt-space-4)", marginBottom: task.status === "running" ? "var(--dt-space-4)" : 0, padding: "var(--dt-space-4)", backgroundColor: "var(--dt-bg-tertiary)", borderRadius: "var(--dt-radius-md)" }}>
              <div>
                <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", marginBottom: "var(--dt-space-1)" }}>Status</div>
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)", fontFamily: "var(--dt-font-mono)" }}>{task.rawStatus}</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", marginBottom: "var(--dt-space-1)" }}>Created</div>
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)", fontFamily: "var(--dt-font-mono)" }}>{task.startTime}</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", marginBottom: "var(--dt-space-1)" }}>Updated</div>
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)", fontFamily: "var(--dt-font-mono)" }}>{task.duration}</div>
              </div>
            </div>

            {/* Progress Bar */}
            {task.status === "running" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-2)", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--dt-bg-tertiary)", borderRadius: "var(--dt-radius-full)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${task.progress}%`, backgroundColor: "var(--dt-accent-primary)", transition: "width 0.3s ease", borderRadius: "var(--dt-radius-full)" }} />
                </div>
              </div>
            )}

            {/* Output */}
            {task.output && (
              <div style={{ marginTop: "var(--dt-space-4)", padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-primary)", borderRadius: "var(--dt-radius-md)", fontSize: "var(--dt-text-sm)", fontFamily: "var(--dt-font-mono)", color: task.status === "error" ? "var(--dt-status-error)" : "var(--dt-status-success)", wordBreak: "break-all" }}>
                {task.output}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "var(--dt-space-16)", color: "var(--dt-text-tertiary)" }}>
          <p style={{ fontSize: "var(--dt-text-lg)" }}>No {filter !== "all" ? filter : ""} tasks found</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}