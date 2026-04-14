import { Outlet, Link, useLocation } from "react-router";
import { 
  Home, 
  Package, 
  Play, 
  Activity, 
  Server, 
  Settings as SettingsIcon,
  Palette,
  Search,
  Bell,
  Terminal,
  Zap
} from "lucide-react";
import { useState } from "react";

export function RootLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navigation = [
    { name: "Home", path: "/", icon: Home },
    { name: "All Tools", path: "/available-tools", icon: Package },
    { name: "Tasks", path: "/tasks", icon: Activity },
    { name: "Server", path: "/server", icon: Server },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
    { name: "Design System", path: "/design-system", icon: Palette },
  ];

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      backgroundColor: "var(--dt-bg-primary)",
      fontFamily: "var(--dt-font-sans)"
    }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        backgroundColor: "var(--dt-bg-secondary)",
        borderRight: "1px solid var(--dt-border-primary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: "var(--dt-space-6)",
          borderBottom: "1px solid var(--dt-border-primary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)" }}>
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "var(--dt-accent-primary)",
              borderRadius: "var(--dt-radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Terminal size={24} color="white" />
            </div>
            <div>
              <h1 style={{ 
                fontSize: "var(--dt-text-lg)",
                fontWeight: "var(--dt-font-semibold)",
                color: "var(--dt-text-primary)",
                margin: 0,
                lineHeight: 1.2
              }}>
                DevTools
              </h1>
              <p style={{
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)",
                margin: 0
              }}>
                Platform v2.0
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: "var(--dt-space-4)",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-1)" }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--dt-space-3)",
                    padding: "var(--dt-space-3) var(--dt-space-4)",
                    borderRadius: "var(--dt-radius-md)",
                    color: active ? "var(--dt-accent-primary)" : "var(--dt-text-secondary)",
                    backgroundColor: active ? "rgba(99, 102, 241, 0.1)" : "transparent",
                    textDecoration: "none",
                    fontSize: "var(--dt-text-sm)",
                    fontWeight: "var(--dt-font-medium)",
                    transition: "all var(--dt-transition-fast)",
                    border: active ? "1px solid var(--dt-accent-primary)" : "1px solid transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status Footer */}
        <div style={{
          padding: "var(--dt-space-4)",
          borderTop: "1px solid var(--dt-border-primary)",
          backgroundColor: "var(--dt-bg-tertiary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", marginBottom: "var(--dt-space-2)" }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--dt-status-success)",
              animation: "pulse 2s infinite"
            }} />
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)" }}>
              System Ready
            </span>
          </div>
          <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)" }}>
            <Zap size={12} style={{ display: "inline", marginRight: "4px" }} />
            Local Mode
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Top Bar */}
        <header style={{
          height: "64px",
          backgroundColor: "var(--dt-bg-secondary)",
          borderBottom: "1px solid var(--dt-border-primary)",
          display: "flex",
          alignItems: "center",
          padding: "0 var(--dt-space-6)",
          gap: "var(--dt-space-4)"
        }}>
          {/* Search Bar */}
          <div style={{
            flex: 1,
            maxWidth: "500px",
            position: "relative"
          }}>
            <Search 
              size={18} 
              style={{
                position: "absolute",
                left: "var(--dt-space-3)",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--dt-text-tertiary)"
              }}
            />
            <input
              type="text"
              placeholder="Search tools, plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "var(--dt-space-2) var(--dt-space-3) var(--dt-space-2) var(--dt-space-10)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                color: "var(--dt-text-primary)",
                fontSize: "var(--dt-text-sm)",
                outline: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--dt-accent-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--dt-border-primary)";
              }}
            />
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", gap: "var(--dt-space-2)", marginLeft: "auto" }}>
            <button style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--dt-radius-md)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--dt-text-secondary)"
            }}>
              <Bell size={18} />
            </button>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--dt-radius-md)",
              backgroundColor: "var(--dt-accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-semibold)",
              color: "white"
            }}>
              DT
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "var(--dt-bg-primary)"
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
