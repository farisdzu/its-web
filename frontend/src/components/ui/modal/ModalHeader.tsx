import { ReactNode } from "react";

export interface ModalHeaderProps {
  title: string;
  description?: string | ReactNode;
  className?: string;
}

/**
 * ModalHeader - Reusable modal header component
 * 
 * @example
 * ```tsx
 * <ModalHeader
 *   title="Edit Item"
 *   description="Update item information"
 * />
 * ```
 */
export default function ModalHeader({
  title,
  description,
  className = "",
}: ModalHeaderProps) {
  return (
    <div className={`px-0 sm:px-2 pr-8 sm:pr-14 ${className}`}>
      <h4 className="mb-2 text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      {description && (
        <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {typeof description === "string" ? description : description}
        </p>
      )}
    </div>
  );
}

