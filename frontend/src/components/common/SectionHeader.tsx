import { FC, ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  count?: number;
  description?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable section header component
 * Standardized styling for section titles across the application
 */
const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  count,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`mb-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {title}
          {count !== undefined && ` (${count})`}
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {typeof description === "string" ? description : description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;

