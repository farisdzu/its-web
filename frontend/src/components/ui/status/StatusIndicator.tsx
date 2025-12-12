import { FC } from "react";

export interface StatusIndicatorProps {
  status: "active" | "inactive" | "online" | "offline" | "busy";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * StatusIndicator - Reusable status indicator dot component
 * 
 * @example
 * ```tsx
 * <StatusIndicator status="active" size="sm" />
 * ```
 */
export const StatusIndicator: FC<StatusIndicatorProps> = ({
  status,
  size = "sm",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const statusColors = {
    active: "bg-emerald-500",
    inactive: "bg-gray-400",
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    busy: "bg-warning-500",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${statusColors[status]} rounded-full shrink-0 ${className}`}
      aria-label={status}
    />
  );
};

