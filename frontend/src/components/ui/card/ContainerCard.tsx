import { ReactNode } from "react";

export interface ContainerCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

/**
 * ContainerCard - Reusable container card for wrapping content sections
 * 
 * @example
 * ```tsx
 * <ContainerCard padding="md">
 *   <div>Content</div>
 * </ContainerCard>
 * ```
 */
export default function ContainerCard({
  children,
  className = "",
  padding = "md",
}: ContainerCardProps) {
  const paddingClasses = {
    sm: "p-2 sm:p-3",
    md: "p-3 sm:p-4",
    lg: "p-4 sm:p-6 lg:p-8",
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

