import { RouterProvider } from "react-router";
import { generateRouter } from "./routes";
import "../styles/devtools-theme.css";
import "./ToolLoader";
import { useEffect, useMemo, useState } from "react";
import { loadTools } from "./ToolLoader";
import { Loader2 } from "lucide-react";

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await loadTools();
        setReady(true);
        console.log("All tools loaded");
      } catch (error) {
        console.error("Tool loading failed", error);
        setBootError("Failed to load tools. Please refresh and try again.");
      }
    }

    init();
  }, []);

  const loadingIndicator = useMemo(
    () => (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--dt-bg-primary)",
          padding: "var(--dt-space-6)",
        }}
      >
        <div
          style={{
            width: "min(92vw, 440px)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            padding: "var(--dt-space-8)",
            textAlign: "center",
            boxShadow: "var(--dt-shadow-md)",
          }}
        >
          <Loader2
            aria-hidden="true"
            size={28}
            style={{
              color: "var(--dt-accent-primary)",
              marginBottom: "var(--dt-space-3)",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              fontSize: "var(--dt-text-base)",
              color: "var(--dt-text-primary)",
              margin: 0,
            }}
          >
            Loading DevTools workspace...
          </p>
          <p
            style={{
              margin: "var(--dt-space-2) 0 0",
              fontSize: "var(--dt-text-sm)",
              color: "var(--dt-text-tertiary)",
            }}
          >
            Initializing tool registry and routes.
          </p>
        </div>
      </div>
    ),
    [],
  );

  if (bootError) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--dt-bg-primary)",
          padding: "var(--dt-space-6)",
        }}
      >
        <div
          role="alert"
          style={{
            width: "min(92vw, 480px)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-accent-error)",
            borderRadius: "var(--dt-radius-lg)",
            padding: "var(--dt-space-6)",
            color: "var(--dt-text-primary)",
          }}
        >
          <h1 style={{ margin: "0 0 var(--dt-space-2)", fontSize: "var(--dt-text-xl)" }}>
            App failed to start
          </h1>
          <p style={{ margin: 0, color: "var(--dt-text-secondary)" }}>{bootError}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return loadingIndicator;
  }

  return (
    <>
      <RouterProvider router={generateRouter()} />
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </>
  );
}
