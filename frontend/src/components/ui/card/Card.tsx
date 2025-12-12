import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

/**
 * Card - Reusable card container component
 * 
 * @example
 * ```tsx
 * <Card padding="md" hover>
 *   <div>Card content</div>
 * </Card>
 * ```
 */
export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-2 sm:p-2.5",
    md: "p-2.5 sm:p-3",
    lg: "p-3 sm:p-4",
  };

  const hoverClasses = hover
    ? "hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
    : "";

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 ${paddingClasses[padding]} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}

