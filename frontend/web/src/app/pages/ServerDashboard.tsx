import { useCallback, useEffect, useMemo, useState } from "react";
import { Cpu, HardDrive, Activity, Clock, RefreshCw, Loader2 } from "lucide-react";
import { TerminalOutput, type LogEntry } from "../components/TerminalOutput";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../core/api";
import { listJobs, type JobResponse } from "../core/jobs";

interface Stats {
  uptimeSeconds: number;
  nodeVersion: string;
  pid: number;
  loadAverage1m: number;
  memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number };
  jobs: { running: number; pending: number; completed: number; failed: number; total: number };
  storage: { path: string; files: number; bytes: number };
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

export function ServerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    setLogs((prev) => [...prev.slice(-49), { level, message, timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  const load = useCallback(async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([api.get<Stats>("/api/stats"), listJobs(50)]);
      setStats(statsRes.data);
      setJobs(jobsRes.jobs ?? []);
      if (!online) {
        setOnline(true);
        addLog("success", "Connected to backend");
      }
      setError(undefined);
    } catch (e: any) {
      setOnline(false);
      setError(e?.response?.data?.error || e?.message || "Failed to reach the backend.");
      addLog("error", "Backend request failed");
    } finally {
      setLoading(false);
    }
  }, [addLog, online]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, not a synchronous setState
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const running = stats?.jobs.running ?? 0;
    const heapPct = stats ? Math.round((stats.memory.heapUsedBytes / stats.memory.heapTotalBytes) * 100) : 0;
    return [
      { label: "Load (1m)", value: stats ? stats.loadAverage1m.toFixed(2) : "—", icon: Cpu, color: "var(--dt-status-success)" },
      { label: "Heap Used", value: stats ? formatBytes(stats.memory.heapUsedBytes) : "—", icon: HardDrive, color: heapPct > 80 ? "var(--dt-status-warning)" : "var(--dt-status-success)" },
      { label: "Active Jobs", value: String(running), icon: Activity, color: "var(--dt-status-running)" },
      { label: "Uptime", value: stats ? formatUptime(stats.uptimeSeconds) : "—", icon: Clock, color: "var(--dt-accent-primary)" },
    ];
  }, [stats]);

  const runningJobs = useMemo(
    () => jobs.filter((j) => j.status === "running" || j.status === "pending").slice(0, 6),
    [jobs]
  );

  const heapPct = stats && stats.memory.heapTotalBytes ? Math.round((stats.memory.heapUsedBytes / stats.memory.heapTotalBytes) * 100) : 0;

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--dt-space-8)", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)", margin: "0 0 var(--dt-space-2) 0" }}>
            Server Dashboard
          </h1>
          <p style={{ fontSize: "var(--dt-text-base)", color: "var(--dt-text-secondary)", margin: 0 }}>
            Live process metrics and background jobs from the backend.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
          <StatusBadge status={online ? "success" : "error"} label={online ? "Server Online" : "Offline"} />
          <div style={{ padding: "var(--dt-space-3) var(--dt-space-4)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", fontFamily: "var(--dt-font-mono)", fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)", wordBreak: "break-all" }}>
            {api.defaults.baseURL}
          </div>
          <button
            type="button"
            onClick={() => { void load(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-text-secondary)", cursor: "pointer" }}
          >
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: "var(--dt-space-6)", padding: "var(--dt-space-3)", border: "1px solid var(--dt-accent-error)", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-accent-error)" }}>
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--dt-text-tertiary)" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} aria-hidden="true" /> Loading metrics...
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--dt-space-4)", marginBottom: "var(--dt-space-8)" }}>
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} style={{ padding: "var(--dt-space-5)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)" }}>
                  <div style={{ width: "40px", height: "40px", backgroundColor: `${metric.color}20`, border: `2px solid ${metric.color}`, borderRadius: "var(--dt-radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--dt-space-3)" }}>
                    <Icon size={20} color={metric.color} aria-hidden="true" />
                  </div>
                  <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", marginBottom: "var(--dt-space-1)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: "var(--dt-text-2xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)" }}>
                    {metric.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "var(--dt-space-6)", marginBottom: "var(--dt-space-8)" }}>
            {/* Running Jobs */}
            <div style={{ backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)", padding: "var(--dt-space-6)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--dt-space-5)" }}>
                <h2 style={{ fontSize: "var(--dt-text-xl)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", margin: 0 }}>
                  Active Jobs
                </h2>
                <div style={{ padding: "var(--dt-space-1) var(--dt-space-3)", backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid var(--dt-status-running)", borderRadius: "var(--dt-radius-full)", fontSize: "var(--dt-text-xs)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-status-running)" }}>
                  {runningJobs.length} active
                </div>
              </div>

              {runningJobs.length === 0 ? (
                <p style={{ color: "var(--dt-text-tertiary)", fontSize: "var(--dt-text-sm)", margin: 0 }}>No jobs are currently queued or running.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
                  {runningJobs.map((job) => (
                    <div key={job.jobId || job.id} style={{ padding: "var(--dt-space-4)", backgroundColor: "var(--dt-bg-tertiary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-3)", gap: "var(--dt-space-3)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-text-primary)", marginBottom: "var(--dt-space-1)", wordBreak: "break-all" }}>
                            {job.toolId}
                          </div>
                          <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", fontFamily: "var(--dt-font-mono)", wordBreak: "break-all" }}>
                            {job.jobId || job.id}
                          </div>
                        </div>
                        <StatusBadge status={job.status === "running" ? "running" : "queued"} size="sm" />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-1)", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                          <span>Progress</span>
                          <span>{job.progress ?? 0}%</span>
                        </div>
                        <div style={{ height: "6px", backgroundColor: "var(--dt-bg-primary)", borderRadius: "var(--dt-radius-full)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${job.progress ?? 0}%`, backgroundColor: "var(--dt-accent-primary)", borderRadius: "var(--dt-radius-full)", transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Resources */}
            <div style={{ backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)", padding: "var(--dt-space-6)" }}>
              <h2 style={{ fontSize: "var(--dt-text-xl)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", margin: "0 0 var(--dt-space-5) 0" }}>
                System Resources
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-5)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-2)" }}>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>Heap Usage</span>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                      {stats ? `${formatBytes(stats.memory.heapUsedBytes)} / ${formatBytes(stats.memory.heapTotalBytes)} (${heapPct}%)` : "—"}
                    </span>
                  </div>
                  <div style={{ height: "12px", backgroundColor: "var(--dt-bg-tertiary)", borderRadius: "var(--dt-radius-full)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${heapPct}%`, background: "linear-gradient(90deg, var(--dt-status-success), var(--dt-status-warning))", borderRadius: "var(--dt-radius-full)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-2)" }}>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>Resident Memory (RSS)</span>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                      {stats ? formatBytes(stats.memory.rssBytes) : "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--dt-space-2)" }}>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>Tracked Storage</span>
                    <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                      {stats ? `${stats.storage.files} files • ${formatBytes(stats.storage.bytes)}` : "—"}
                    </span>
                  </div>
                  {stats && (
                    <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", fontFamily: "var(--dt-font-mono)", wordBreak: "break-all" }}>
                      {stats.storage.path}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--dt-space-3)" }}>
                  <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Node {stats?.nodeVersion ?? "—"}</div>
                  <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>PID {stats?.pid ?? "—"}</div>
                  <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Jobs total {stats?.jobs.total ?? 0}</div>
                  <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Failed {stats?.jobs.failed ?? 0}</div>
                </div>
              </div>
            </div>
          </div>

          <TerminalOutput
            logs={logs}
            title="Server Activity"
            height="300px"
            clearLogs={() => setLogs([])}
          />
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}