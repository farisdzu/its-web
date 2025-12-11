import { ReactNode } from "react";

export interface EmptyStateProps {
  title?: string;
  description?: string | ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * EmptyState - Reusable empty state component
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="Belum ada data"
 *   description="Tambahkan data untuk memulai"
 *   action={<Button>Tambah Data</Button>}
 * />
 * ```
 */
export default function EmptyState({
  title = "Belum ada data",
  description,
  action,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}>
      {icon && <div className="mb-4 text-gray-400 dark:text-gray-500">{icon}</div>}
      <h3 className="text-sm font-medium text-gray-900 dark:text-white/90 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {typeof description === "string" ? description : description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

