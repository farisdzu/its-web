import { ReactNode } from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string | ReactNode;
}

/**
 * LoadingSpinner - Reusable loading spinner component
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" text="Memuat data..." />
 * ```
 */
export default function LoadingSpinner({
  size = "md",
  className = "",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin dark:border-gray-700 dark:border-t-brand-400`}
      />
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

