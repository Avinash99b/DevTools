import { Circle } from "lucide-react";

type StatusType = "running" | "success" | "error" | "warning" | "idle" | "queued";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

const statusConfig = {
  running: {
    color: "var(--dt-status-running)",
    bg: "rgba(59, 130, 246, 0.1)",
    label: "Running"
  },
  success: {
    color: "var(--dt-status-success)",
    bg: "rgba(16, 185, 129, 0.1)",
    label: "Success"
  },
  error: {
    color: "var(--dt-status-error)",
    bg: "rgba(239, 68, 68, 0.1)",
    label: "Error"
  },
  warning: {
    color: "var(--dt-status-warning)",
    bg: "rgba(245, 158, 11, 0.1)",
    label: "Warning"
  },
  idle: {
    color: "var(--dt-status-idle)",
    bg: "rgba(107, 114, 128, 0.1)",
    label: "Idle"
  },
  queued: {
    color: "var(--dt-text-tertiary)",
    bg: "rgba(156, 163, 175, 0.1)",
    label: "Queued"
  }
};

const sizeConfig = {
  sm: {
    padding: "var(--dt-space-1) var(--dt-space-2)",
    fontSize: "var(--dt-text-xs)",
    dotSize: 6
  },
  md: {
    padding: "var(--dt-space-1) var(--dt-space-3)",
    fontSize: "var(--dt-text-sm)",
    dotSize: 8
  },
  lg: {
    padding: "var(--dt-space-2) var(--dt-space-4)",
    fontSize: "var(--dt-text-base)",
    dotSize: 10
  }
};

export function StatusBadge({ 
  status, 
  label, 
  size = "md",
  showDot = true 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const displayLabel = label || config.label;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--dt-space-2)",
      padding: sizeStyles.padding,
      backgroundColor: config.bg,
      border: `1px solid ${config.color}`,
      borderRadius: "var(--dt-radius-full)",
      fontSize: sizeStyles.fontSize,
      fontWeight: "var(--dt-font-medium)",
      color: config.color
    }}>
      {showDot && (
        <div style={{
          width: `${sizeStyles.dotSize}px`,
          height: `${sizeStyles.dotSize}px`,
          borderRadius: "50%",
          backgroundColor: config.color,
          animation: status === "running" ? "pulse 2s infinite" : "none"
        }} />
      )}
      {displayLabel}
    </div>
  );
}
