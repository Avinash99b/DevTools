import { Outlet, Link, useLocation } from "react-router";
import {
  Home,
  Package,
  Activity,
  Server,
  Settings as SettingsIcon,
  Palette,
  Search,
  Bell,
  Terminal,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TABLET_BREAKPOINT = 1024;
const PHONE_BREAKPOINT = 768;

function getViewportState() {
  if (typeof window === "undefined") {
    return { isTabletOrBelow: false, isPhone: false };
  }

  return {
    isTabletOrBelow: window.innerWidth < TABLET_BREAKPOINT,
    isPhone: window.innerWidth < PHONE_BREAKPOINT,
  };
}

export function RootLayout() {
  const location = useLocation();
  const viewport = getViewportState();
  const [searchQuery, setSearchQuery] = useState("");
  const [isTabletOrBelow, setIsTabletOrBelow] = useState(viewport.isTabletOrBelow);
  const [isPhone, setIsPhone] = useState(viewport.isPhone);
  const [sidebarOpen, setSidebarOpen] = useState(!viewport.isTabletOrBelow);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewportState();
      setIsTabletOrBelow(nextViewport.isTabletOrBelow);
      setIsPhone(nextViewport.isPhone);
      setSidebarOpen((current) =>
        nextViewport.isTabletOrBelow ? current : true,
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (!isTextInput && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarOpen((current) => !current);
      }

      if (event.key === "Escape" && isTabletOrBelow) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [isTabletOrBelow]);

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

  const sidebarWidth = isTabletOrBelow ? "min(86vw, 300px)" : "260px";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "var(--dt-bg-primary)",
        fontFamily: "var(--dt-font-sans)",
        overflow: "hidden",
      }}
    >
      {isTabletOrBelow && sidebarOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            border: "none",
            background: "rgba(10, 14, 26, 0.55)",
            zIndex: "var(--dt-z-modal-backdrop)",
            cursor: "pointer",
          }}
        />
      )}

      <aside
        style={{
          width: sidebarWidth,
          maxWidth: "100%",
          backgroundColor: "var(--dt-bg-secondary)",
          borderRight: "1px solid var(--dt-border-primary)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: isTabletOrBelow ? "fixed" : "relative",
          inset: isTabletOrBelow ? "0 auto 0 0" : "auto",
          zIndex: "var(--dt-z-modal)",
          transform:
            isTabletOrBelow && !sidebarOpen ? "translateX(-102%)" : "translateX(0)",
          transition: "transform var(--dt-transition-base)",
          boxShadow: isTabletOrBelow ? "var(--dt-shadow-xl)" : "none",
        }}
      >
        <div
          style={{
            padding: isPhone ? "var(--dt-space-4)" : "var(--dt-space-6)",
            borderBottom: "1px solid var(--dt-border-primary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--dt-space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "var(--dt-accent-primary)",
                borderRadius: "var(--dt-radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Terminal size={22} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "var(--dt-text-lg)",
                  fontWeight: "var(--dt-font-semibold)",
                  color: "var(--dt-text-primary)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                DevTools
              </h1>
              <p
                style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)",
                  margin: 0,
                }}
              >
                Platform v2.0
              </p>
            </div>
          </div>

          {isTabletOrBelow && (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--dt-radius-md)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                color: "var(--dt-text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav
          aria-label="Main navigation"
          style={{
            flex: 1,
            padding: "var(--dt-space-4)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (isTabletOrBelow) {
                      setSidebarOpen(false);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--dt-space-3)",
                    minHeight: "44px",
                    padding: "var(--dt-space-3) var(--dt-space-4)",
                    borderRadius: "var(--dt-radius-md)",
                    color: active ? "var(--dt-accent-primary)" : "var(--dt-text-secondary)",
                    backgroundColor: active ? "rgba(99, 102, 241, 0.1)" : "transparent",
                    textDecoration: "none",
                    fontSize: "var(--dt-text-sm)",
                    fontWeight: "var(--dt-font-medium)",
                    transition: "all var(--dt-transition-fast)",
                    border: active
                      ? "1px solid var(--dt-accent-primary)"
                      : "1px solid transparent",
                  }}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div
          style={{
            padding: "var(--dt-space-4)",
            borderTop: "1px solid var(--dt-border-primary)",
            backgroundColor: "var(--dt-bg-tertiary)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
              marginBottom: "var(--dt-space-2)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--dt-status-success)",
                animation: "pulse 2s infinite",
              }}
            />
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

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            minHeight: isPhone ? "72px" : "64px",
            backgroundColor: "var(--dt-bg-secondary)",
            borderBottom: "1px solid var(--dt-border-primary)",
            display: "flex",
            alignItems: "center",
            flexWrap: isPhone ? "wrap" : "nowrap",
            rowGap: "var(--dt-space-3)",
            padding: isPhone
              ? "var(--dt-space-3) var(--dt-space-4)"
              : "0 var(--dt-space-6)",
            gap: "var(--dt-space-3)",
          }}
        >
          {isTabletOrBelow && (
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--dt-radius-md)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                color: "var(--dt-text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Menu size={18} />
            </button>
          )}

          <div
            style={{
              flex: 1,
              minWidth: isPhone ? "100%" : 0,
              maxWidth: isPhone ? "100%" : "520px",
              position: "relative",
              order: isPhone ? 3 : 1,
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "var(--dt-space-3)",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--dt-text-tertiary)",
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tools... ( / )"
              aria-label="Search tools"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                width: "100%",
                minHeight: "42px",
                padding: "var(--dt-space-2) var(--dt-space-3) var(--dt-space-2) var(--dt-space-10)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                color: "var(--dt-text-primary)",
                fontSize: "var(--dt-text-sm)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--dt-space-2)", marginLeft: "auto" }}>
            <button
              type="button"
              aria-label="Notifications"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--dt-radius-md)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--dt-text-secondary)",
              }}
            >
              <Bell size={18} />
            </button>
            <div
              aria-label="User profile"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--dt-radius-md)",
                backgroundColor: "var(--dt-accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-semibold)",
                color: "white",
              }}
            >
              DT
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "var(--dt-bg-primary)",
            minWidth: 0,
          }}
        >
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
