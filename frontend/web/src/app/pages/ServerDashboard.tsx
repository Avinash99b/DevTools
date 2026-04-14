import { useState } from "react";
import { Server, Cpu, HardDrive, Activity, Zap, Clock, TrendingUp } from "lucide-react";
import { TerminalOutput } from "../components/TerminalOutput";
import { StatusBadge } from "../components/StatusBadge";

export function ServerDashboard() {
  const [serverLogs] = useState([
    { timestamp: "14:35:42", level: "info" as const, message: "Server started on port 8080" },
    { timestamp: "14:36:15", level: "success" as const, message: "Connected to database successfully" },
    { timestamp: "14:37:03", level: "info" as const, message: "Processing job #12345" },
    { timestamp: "14:37:45", level: "warning" as const, message: "High memory usage detected (85%)" },
    { timestamp: "14:38:12", level: "success" as const, message: "Job #12345 completed in 69s" },
    { timestamp: "14:38:30", level: "info" as const, message: "New client connected: 192.168.1.105" }
  ]);

  const metrics = [
    {
      label: "CPU Usage",
      value: "34%",
      icon: Cpu,
      color: "var(--dt-status-success)",
      trend: "+2%"
    },
    {
      label: "Memory",
      value: "6.2 GB",
      icon: HardDrive,
      color: "var(--dt-status-warning)",
      trend: "+12%"
    },
    {
      label: "Active Jobs",
      value: "3",
      icon: Activity,
      color: "var(--dt-status-running)",
      trend: "-1"
    },
    {
      label: "Uptime",
      value: "12d 5h",
      icon: Clock,
      color: "var(--dt-accent-primary)",
      trend: "stable"
    }
  ];

  const runningJobs = [
    {
      id: "job-001",
      tool: "Image Compressor",
      client: "192.168.1.102",
      progress: 78,
      duration: "00:03:24"
    },
    {
      id: "job-002",
      tool: "Video Transcoder",
      client: "192.168.1.105",
      progress: 23,
      duration: "00:01:12"
    },
    {
      id: "job-003",
      tool: "APK Analyzer",
      client: "192.168.1.108",
      progress: 91,
      duration: "00:04:55"
    }
  ];

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--dt-space-8)"
      }}>
        <div>
          <h1 style={{
            fontSize: "var(--dt-text-3xl)",
            fontWeight: "var(--dt-font-bold)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-2) 0"
          }}>
            Server Dashboard
          </h1>
          <p style={{
            fontSize: "var(--dt-text-base)",
            color: "var(--dt-text-secondary)",
            margin: 0
          }}>
            Monitor remote execution server performance and jobs
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-4)" }}>
          <StatusBadge status="success" label="Server Online" />
          <div style={{
            padding: "var(--dt-space-3) var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-md)",
            fontFamily: "var(--dt-font-mono)",
            fontSize: "var(--dt-text-sm)",
            color: "var(--dt-text-secondary)"
          }}>
            http://localhost:8080
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "var(--dt-space-4)",
        marginBottom: "var(--dt-space-8)"
      }}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              style={{
                padding: "var(--dt-space-5)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)",
                transition: "all var(--dt-transition-base)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--dt-border-secondary)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--dt-border-primary)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--dt-space-3)"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: `${metric.color}20`,
                  border: `2px solid ${metric.color}`,
                  borderRadius: "var(--dt-radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon size={20} color={metric.color} />
                </div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: metric.trend.startsWith("+") ? "var(--dt-status-warning)" : "var(--dt-status-success)",
                  fontWeight: "var(--dt-font-medium)"
                }}>
                  {metric.trend}
                </div>
              </div>
              <div style={{
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)",
                marginBottom: "var(--dt-space-1)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {metric.label}
              </div>
              <div style={{
                fontSize: "var(--dt-text-2xl)",
                fontWeight: "var(--dt-font-bold)",
                color: "var(--dt-text-primary)"
              }}>
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--dt-space-6)",
        marginBottom: "var(--dt-space-8)"
      }}>
        {/* Running Jobs */}
        <div style={{
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
          padding: "var(--dt-space-6)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--dt-space-5)"
          }}>
            <h2 style={{
              fontSize: "var(--dt-text-xl)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: 0
            }}>
              Running Jobs
            </h2>
            <div style={{
              padding: "var(--dt-space-1) var(--dt-space-3)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid var(--dt-status-running)",
              borderRadius: "var(--dt-radius-full)",
              fontSize: "var(--dt-text-xs)",
              fontWeight: "var(--dt-font-medium)",
              color: "var(--dt-status-running)"
            }}>
              {runningJobs.length} active
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
            {runningJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  padding: "var(--dt-space-4)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "var(--dt-space-3)"
                }}>
                  <div>
                    <div style={{
                      fontSize: "var(--dt-text-sm)",
                      fontWeight: "var(--dt-font-medium)",
                      color: "var(--dt-text-primary)",
                      marginBottom: "var(--dt-space-1)"
                    }}>
                      {job.tool}
                    </div>
                    <div style={{
                      fontSize: "var(--dt-text-xs)",
                      color: "var(--dt-text-tertiary)",
                      fontFamily: "var(--dt-font-mono)"
                    }}>
                      {job.id} • {job.client}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "var(--dt-text-xs)",
                    color: "var(--dt-text-secondary)",
                    fontFamily: "var(--dt-font-mono)"
                  }}>
                    {job.duration}
                  </div>
                </div>

                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--dt-space-1)",
                    fontSize: "var(--dt-text-xs)",
                    color: "var(--dt-text-tertiary)"
                  }}>
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div style={{
                    height: "6px",
                    backgroundColor: "var(--dt-bg-primary)",
                    borderRadius: "var(--dt-radius-full)",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${job.progress}%`,
                      backgroundColor: "var(--dt-accent-primary)",
                      borderRadius: "var(--dt-radius-full)",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Resources */}
        <div style={{
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
          padding: "var(--dt-space-6)"
        }}>
          <h2 style={{
            fontSize: "var(--dt-text-xl)",
            fontWeight: "var(--dt-font-semibold)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-5) 0"
          }}>
            System Resources
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-5)" }}>
            {/* CPU Chart */}
            <div>
              <div style={{
                fontSize: "var(--dt-text-sm)",
                color: "var(--dt-text-secondary)",
                marginBottom: "var(--dt-space-2)"
              }}>
                CPU Usage (4 cores)
              </div>
              <div style={{ display: "flex", gap: "var(--dt-space-2)", alignItems: "flex-end", height: "80px" }}>
                {[45, 38, 52, 34, 41, 48, 36, 42, 39, 44, 37, 34].map((value, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${value}%`,
                      backgroundColor: value > 50 ? "var(--dt-status-warning)" : "var(--dt-accent-primary)",
                      borderRadius: "var(--dt-radius-sm)",
                      transition: "all 0.3s ease"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "var(--dt-space-2)"
              }}>
                <span style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)"
                }}>
                  Memory Usage
                </span>
                <span style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-primary)",
                  fontWeight: "var(--dt-font-medium)"
                }}>
                  6.2 / 16 GB (39%)
                </span>
              </div>
              <div style={{
                height: "12px",
                backgroundColor: "var(--dt-bg-tertiary)",
                borderRadius: "var(--dt-radius-full)",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: "39%",
                  background: "linear-gradient(90deg, var(--dt-status-success), var(--dt-status-warning))",
                  borderRadius: "var(--dt-radius-full)"
                }} />
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "var(--dt-space-2)"
              }}>
                <span style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)"
                }}>
                  Disk Usage
                </span>
                <span style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-primary)",
                  fontWeight: "var(--dt-font-medium)"
                }}>
                  245 / 500 GB (49%)
                </span>
              </div>
              <div style={{
                height: "12px",
                backgroundColor: "var(--dt-bg-tertiary)",
                borderRadius: "var(--dt-radius-full)",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: "49%",
                  backgroundColor: "var(--dt-status-success)",
                  borderRadius: "var(--dt-radius-full)"
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Server Logs */}
      <TerminalOutput 
        logs={serverLogs}
        title="Server Logs"
        height="300px"
      />
    </div>
  );
}
