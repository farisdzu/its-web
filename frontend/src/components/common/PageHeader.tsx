import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Reusable page header component with title, description, and optional action button
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Struktur Organisasi"
 *   description="Kelola struktur organisasi"
 *   action={<Button>+ Tambah</Button>}
 * />
 * ```
 */
export default function PageHeader({
  title,
  description,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {typeof description === "string" ? description : description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  );
}

