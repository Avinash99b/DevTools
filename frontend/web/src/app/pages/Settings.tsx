import { useState } from "react";
import { Save, RotateCcw, Server, Zap, Bell, Palette, Shield, Database } from "lucide-react";

export function Settings() {
  const [executionMode, setExecutionMode] = useState<"local" | "remote">("local");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [serverUrl, setServerUrl] = useState("http://localhost:8080");
  const [maxConcurrent, setMaxConcurrent] = useState("3");

  const settingsSections = [
    {
      title: "Execution",
      icon: Zap,
      settings: [
        {
          id: "execution-mode",
          label: "Default Execution Mode",
          description: "Choose whether tools run locally or on a remote server by default",
          component: (
            <div style={{
              display: "flex",
              gap: "var(--dt-space-2)",
              backgroundColor: "var(--dt-bg-tertiary)",
              padding: "var(--dt-space-1)",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)"
            }}>
              <button
                onClick={() => setExecutionMode("local")}
                style={{
                  flex: 1,
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: executionMode === "local" ? "var(--dt-accent-primary)" : "transparent",
                  color: executionMode === "local" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer"
                }}
              >
                Local
              </button>
              <button
                onClick={() => setExecutionMode("remote")}
                style={{
                  flex: 1,
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: executionMode === "remote" ? "var(--dt-accent-primary)" : "transparent",
                  color: executionMode === "remote" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer"
                }}
              >
                Remote
              </button>
            </div>
          )
        },
        {
          id: "max-concurrent",
          label: "Max Concurrent Jobs",
          description: "Maximum number of tools that can run simultaneously",
          component: (
            <input
              type="number"
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(e.target.value)}
              min="1"
              max="10"
              style={{
                width: "100%",
                padding: "var(--dt-space-3)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                color: "var(--dt-text-primary)",
                fontSize: "var(--dt-text-sm)"
              }}
            />
          )
        }
      ]
    },
    {
      title: "Server",
      icon: Server,
      settings: [
        {
          id: "server-url",
          label: "Remote Server URL",
          description: "URL of the remote execution server",
          component: (
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:8080"
              style={{
                width: "100%",
                padding: "var(--dt-space-3)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                color: "var(--dt-text-primary)",
                fontSize: "var(--dt-text-sm)",
                fontFamily: "var(--dt-font-mono)"
              }}
            />
          )
        },
        {
          id: "server-status",
          label: "Connection Status",
          description: "Current connection to remote server",
          component: (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--dt-status-success)"
                }} />
                <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                  Connected
                </span>
              </div>
              <button style={{
                padding: "var(--dt-space-1) var(--dt-space-3)",
                backgroundColor: "var(--dt-bg-primary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-sm)",
                color: "var(--dt-text-secondary)",
                fontSize: "var(--dt-text-xs)",
                cursor: "pointer"
              }}>
                Test Connection
              </button>
            </div>
          )
        }
      ]
    },
    {
      title: "Appearance",
      icon: Palette,
      settings: [
        {
          id: "theme",
          label: "Theme",
          description: "Choose your preferred color scheme",
          component: (
            <div style={{
              display: "flex",
              gap: "var(--dt-space-2)",
              backgroundColor: "var(--dt-bg-tertiary)",
              padding: "var(--dt-space-1)",
              borderRadius: "var(--dt-radius-md)",
              border: "1px solid var(--dt-border-primary)"
            }}>
              <button
                onClick={() => setTheme("dark")}
                style={{
                  flex: 1,
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: theme === "dark" ? "var(--dt-accent-primary)" : "transparent",
                  color: theme === "dark" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer"
                }}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                style={{
                  flex: 1,
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: theme === "light" ? "var(--dt-accent-primary)" : "transparent",
                  color: theme === "light" ? "white" : "var(--dt-text-secondary)",
                  border: "none",
                  borderRadius: "var(--dt-radius-sm)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer"
                }}
              >
                Light
              </button>
            </div>
          )
        }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          id: "notifications",
          label: "Enable Notifications",
          description: "Show notifications when tasks complete",
          component: (
            <label style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{
                  width: "44px",
                  height: "24px",
                  cursor: "pointer",
                  accentColor: "var(--dt-accent-primary)"
                }}
              />
            </label>
          )
        },
        {
          id: "auto-update",
          label: "Auto-update Plugins",
          description: "Automatically update plugins when new versions are available",
          component: (
            <label style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                style={{
                  width: "44px",
                  height: "24px",
                  cursor: "pointer",
                  accentColor: "var(--dt-accent-primary)"
                }}
              />
            </label>
          )
        }
      ]
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
            Settings
          </h1>
          <p style={{
            fontSize: "var(--dt-text-base)",
            color: "var(--dt-text-secondary)",
            margin: 0
          }}>
            Configure your DevTools Platform preferences
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
          <button style={{
            padding: "var(--dt-space-3) var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-md)",
            color: "var(--dt-text-secondary)",
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-medium)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "var(--dt-space-2)"
          }}>
            <RotateCcw size={16} />
            Reset
          </button>
          <button style={{
            padding: "var(--dt-space-3) var(--dt-space-4)",
            backgroundColor: "var(--dt-accent-primary)",
            border: "none",
            borderRadius: "var(--dt-radius-md)",
            color: "white",
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-semibold)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "var(--dt-space-2)"
          }}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-6)" }}>
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              style={{
                padding: "var(--dt-space-6)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--dt-space-3)",
                marginBottom: "var(--dt-space-6)",
                paddingBottom: "var(--dt-space-4)",
                borderBottom: "1px solid var(--dt-border-primary)"
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid var(--dt-accent-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon size={18} color="var(--dt-accent-primary)" />
                </div>
                <h2 style={{
                  fontSize: "var(--dt-text-xl)",
                  fontWeight: "var(--dt-font-semibold)",
                  color: "var(--dt-text-primary)",
                  margin: 0
                }}>
                  {section.title}
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-6)" }}>
                {section.settings.map((setting) => (
                  <div key={setting.id}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "var(--dt-space-6)"
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: "block",
                          fontSize: "var(--dt-text-sm)",
                          fontWeight: "var(--dt-font-medium)",
                          color: "var(--dt-text-primary)",
                          marginBottom: "var(--dt-space-1)"
                        }}>
                          {setting.label}
                        </label>
                        <p style={{
                          fontSize: "var(--dt-text-xs)",
                          color: "var(--dt-text-tertiary)",
                          margin: 0
                        }}>
                          {setting.description}
                        </p>
                      </div>
                      <div style={{ width: "300px" }}>
                        {setting.component}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Danger Zone */}
      <div style={{
        marginTop: "var(--dt-space-8)",
        padding: "var(--dt-space-6)",
        backgroundColor: "rgba(239, 68, 68, 0.05)",
        border: "1px solid var(--dt-status-error)",
        borderRadius: "var(--dt-radius-lg)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--dt-space-3)",
          marginBottom: "var(--dt-space-4)"
        }}>
          <Shield size={20} color="var(--dt-status-error)" />
          <h2 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-semibold)",
            color: "var(--dt-status-error)",
            margin: 0
          }}>
            Danger Zone
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-3)" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
                marginBottom: "var(--dt-space-1)"
              }}>
                Clear All Cache
              </div>
              <div style={{
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)"
              }}>
                Remove all cached data and temporary files
              </div>
            </div>
            <button style={{
              padding: "var(--dt-space-2) var(--dt-space-4)",
              backgroundColor: "transparent",
              border: "1px solid var(--dt-status-error)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-status-error)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)"
            }}>
              <Database size={16} />
              Clear Cache
            </button>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "var(--dt-space-3)",
            borderTop: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            <div>
              <div style={{
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
                marginBottom: "var(--dt-space-1)"
              }}>
                Reset to Defaults
              </div>
              <div style={{
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)"
              }}>
                Restore all settings to their default values
              </div>
            </div>
            <button style={{
              padding: "var(--dt-space-2) var(--dt-space-4)",
              backgroundColor: "transparent",
              border: "1px solid var(--dt-status-error)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-status-error)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)"
            }}>
              <RotateCcw size={16} />
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
