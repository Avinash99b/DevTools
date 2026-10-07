import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional reset key; changing it clears the error state. */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors from a subtree so one broken tool cannot take down the
 * whole application. Used per-route and around the layout outlet.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tool render error", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ padding: "var(--dt-space-8)" }}>
        <div style={{
          display: "flex",
          gap: "var(--dt-space-3)",
          alignItems: "flex-start",
          padding: "var(--dt-space-5)",
          border: "1px solid var(--dt-accent-error)",
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          borderRadius: "var(--dt-radius-lg)",
          color: "var(--dt-text-primary)",
        }}>
          <AlertTriangle size={20} color="var(--dt-accent-error)" aria-hidden="true" />
          <div>
            <h2 style={{ margin: "0 0 var(--dt-space-2)", fontSize: "var(--dt-text-lg)" }}>
              Something went wrong in this view
            </h2>
            <p style={{ margin: 0, color: "var(--dt-text-secondary)", fontSize: "var(--dt-text-sm)" }}>
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              style={{ marginTop: "var(--dt-space-4)", padding: "var(--dt-space-2) var(--dt-space-4)", backgroundColor: "var(--dt-accent-primary)", color: "white", border: "none", borderRadius: "var(--dt-radius-md)", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}