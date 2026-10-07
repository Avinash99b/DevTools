import { useEffect, useState } from "react";
import { Save, RotateCcw, Server, Zap, Bell, Palette, Shield, Database } from "lucide-react";
import { api } from "../core/api";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, applyTheme, type AppSettings } from "../core/settings";

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Reflect the saved theme immediately so the app updates as it changes.
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSave = () => {
    saveSettings(settings);
    applyTheme(settings.theme);
    setStatus({ type: "success", message: "Settings saved." });
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings({ ...DEFAULT_SETTINGS });
    applyTheme(DEFAULT_SETTINGS.theme);
    setStatus({ type: "success", message: "Settings reset to defaults." });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await api.get("/api/health");
      setStatus({ type: "success", message: `Backend reachable (${res.status}).` });
    } catch (e: any) {
      setStatus({ type: "error", message: e?.message || "Could not reach the backend." });
    } finally {
      setTesting(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem("devtools:recent-tools");
      setStatus({ type: "success", message: "Local cache cleared." });
    } catch {
      setStatus({ type: "error", message: "Could not clear local cache." });
    }
  };

  const switchStyle = (active: boolean) => ({
    flex: 1,
    padding: "var(--dt-space-2) var(--dt-space-4)",
    backgroundColor: active ? "var(--dt-accent-primary)" : "transparent",
    color: active ? "white" : "var(--dt-text-secondary)",
    border: "none",
    borderRadius: "var(--dt-radius-sm)",
    fontSize: "var(--dt-text-sm)",
    fontWeight: "var(--dt-font-medium)",
    cursor: "pointer",
  } as const);

  const inputStyle = {
    width: "100%",
    padding: "var(--dt-space-3)",
    backgroundColor: "var(--dt-bg-tertiary)",
    border: "1px solid var(--dt-border-primary)",
    borderRadius: "var(--dt-radius-md)",
    color: "var(--dt-text-primary)",
    fontSize: "var(--dt-text-sm)",
  } as const;

  const sections = [
    {
      title: "Execution",
      icon: Zap,
      settings: [
        {
          id: "execution-mode",
          label: "Default Execution Mode",
          description: "Choose whether tools run locally or on a remote server by default",
          component: (
            <div role="group" aria-label="Default execution mode" style={{ display: "flex", gap: "var(--dt-space-2)", backgroundColor: "var(--dt-bg-tertiary)", padding: "var(--dt-space-1)", borderRadius: "var(--dt-radius-md)", border: "1px solid var(--dt-border-primary)" }}>
              <button type="button" aria-pressed={settings.executionMode === "local"} style={switchStyle(settings.executionMode === "local")} onClick={() => update("executionMode", "local")}>Local</button>
              <button type="button" aria-pressed={settings.executionMode === "remote"} style={switchStyle(settings.executionMode === "remote")} onClick={() => update("executionMode", "remote")}>Remote</button>
            </div>
          ),
        },
        {
          id: "max-concurrent",
          label: "Max Concurrent Jobs",
          description: "Maximum number of tools that can run simultaneously",
          component: (
            <input id="setting-max-concurrent" type="number" value={settings.maxConcurrent} min={1} max={10} onChange={(e) => update("maxConcurrent", Number(e.target.value))} style={inputStyle} />
          ),
        },
      ],
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
            <input id="setting-server-url" type="text" value={settings.serverUrl} placeholder={api.defaults.baseURL || "http://localhost:3000"} onChange={(e) => update("serverUrl", e.target.value)} style={{ ...inputStyle, fontFamily: "var(--dt-font-mono)" }} />
          ),
        },
        {
          id: "server-status",
          label: "Connection Status",
          description: "Current connection to remote server",
          component: (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-tertiary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: status?.type === "error" ? "var(--dt-status-error)" : "var(--dt-status-success)" }} />
                <span style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                  {status?.type === "error" ? "Unreachable" : "Connected"}
                </span>
              </div>
              <button type="button" disabled={testing} onClick={() => { void handleTestConnection(); }} style={{ padding: "var(--dt-space-1) var(--dt-space-3)", backgroundColor: "var(--dt-bg-primary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-sm)", color: "var(--dt-text-secondary)", fontSize: "var(--dt-text-xs)", cursor: "pointer" }}>
                {testing ? "Testing..." : "Test Connection"}
              </button>
            </div>
          ),
        },
      ],
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
            <div role="group" aria-label="Theme" style={{ display: "flex", gap: "var(--dt-space-2)", backgroundColor: "var(--dt-bg-tertiary)", padding: "var(--dt-space-1)", borderRadius: "var(--dt-radius-md)", border: "1px solid var(--dt-border-primary)" }}>
              <button type="button" aria-pressed={settings.theme === "dark"} style={switchStyle(settings.theme === "dark")} onClick={() => update("theme", "dark")}>Dark</button>
              <button type="button" aria-pressed={settings.theme === "light"} style={switchStyle(settings.theme === "light")} onClick={() => update("theme", "light")}>Light</button>
            </div>
          ),
        },
      ],
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
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.notifications} onChange={(e) => update("notifications", e.target.checked)} style={{ width: "44px", height: "24px", cursor: "pointer", accentColor: "var(--dt-accent-primary)" }} />
            </label>
          ),
        },
        {
          id: "auto-update",
          label: "Auto-update Plugins",
          description: "Automatically update plugins when new versions are available",
          component: (
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.autoUpdate} onChange={(e) => update("autoUpdate", e.target.checked)} style={{ width: "44px", height: "24px", cursor: "pointer", accentColor: "var(--dt-accent-primary)" }} />
            </label>
          ),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--dt-space-8)", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)", margin: "0 0 var(--dt-space-2) 0" }}>
            Settings
          </h1>
          <p style={{ fontSize: "var(--dt-text-base)", color: "var(--dt-text-secondary)", margin: 0 }}>
            Configure your DevTools Platform preferences. Settings are stored in this browser.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
          <button type="button" onClick={handleReset} style={{ padding: "var(--dt-space-3) var(--dt-space-4)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-text-secondary)", fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button type="button" onClick={handleSave} style={{ padding: "var(--dt-space-3) var(--dt-space-4)", backgroundColor: "var(--dt-accent-primary)", border: "none", borderRadius: "var(--dt-radius-md)", color: "white", fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
            <Save size={16} aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </div>

      {status && (
        <div role="status" aria-live="polite" style={{ marginBottom: "var(--dt-space-6)", padding: "var(--dt-space-3)", border: `1px solid ${status.type === "error" ? "var(--dt-accent-error)" : "var(--dt-status-success)"}`, backgroundColor: status.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", borderRadius: "var(--dt-radius-md)", color: status.type === "error" ? "var(--dt-accent-error)" : "var(--dt-status-success)" }}>
          {status.message}
        </div>
      )}

      {/* Settings Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-6)" }}>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} style={{ padding: "var(--dt-space-6)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)", marginBottom: "var(--dt-space-6)", paddingBottom: "var(--dt-space-4)", borderBottom: "1px solid var(--dt-border-primary)" }}>
                <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid var(--dt-accent-primary)", borderRadius: "var(--dt-radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color="var(--dt-accent-primary)" aria-hidden="true" />
                </div>
                <h2 style={{ fontSize: "var(--dt-text-xl)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", margin: 0 }}>
                  {section.title}
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-6)" }}>
                {section.settings.map((setting) => (
                  <div key={setting.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--dt-space-6)", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <span style={{ display: "block", fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-text-primary)", marginBottom: "var(--dt-space-1)" }}>
                        {setting.label}
                      </span>
                      <p style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", margin: 0 }}>
                        {setting.description}
                      </p>
                    </div>
                    <div style={{ width: "min(100%, 300px)" }}>
                      {setting.component}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: "var(--dt-space-8)", padding: "var(--dt-space-6)", backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--dt-status-error)", borderRadius: "var(--dt-radius-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)", marginBottom: "var(--dt-space-4)" }}>
          <Shield size={20} color="var(--dt-status-error)" aria-hidden="true" />
          <h2 style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-status-error)", margin: 0 }}>
            Danger Zone
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-text-primary)", marginBottom: "var(--dt-space-1)" }}>Clear All Cache</div>
              <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Remove locally cached data (recent tools, etc.)</div>
            </div>
            <button type="button" onClick={handleClearCache} style={{ padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "transparent", border: "1px solid var(--dt-status-error)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-status-error)", fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
              <Database size={16} aria-hidden="true" />
              Clear Cache
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--dt-space-3)", borderTop: "1px solid rgba(239, 68, 68, 0.2)", gap: "var(--dt-space-4)", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", color: "var(--dt-text-primary)", marginBottom: "var(--dt-space-1)" }}>Reset to Defaults</div>
              <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Restore all settings to their default values</div>
            </div>
            <button type="button" onClick={handleReset} style={{ padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "transparent", border: "1px solid var(--dt-status-error)", borderRadius: "var(--dt-radius-md)", color: "var(--dt-status-error)", fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-medium)", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}