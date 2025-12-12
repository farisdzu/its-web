import { FC } from "react";
import { ChevronDownIcon } from "../../../icons";

export interface ExpandButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  hasChildren: boolean;
  level?: number;
  indentSize?: number;
  className?: string;
}

/**
 * ExpandButton - Reusable expand/collapse button for tree structures
 * 
 * @example
 * ```tsx
 * <ExpandButton
 *   isExpanded={true}
 *   onClick={() => setIsExpanded(!isExpanded)}
 *   hasChildren={true}
 *   level={0}
 * />
 * ```
 */
export const ExpandButton: FC<ExpandButtonProps> = ({
  isExpanded,
  onClick,
  hasChildren,
  level = 0,
  indentSize = 20,
  className = "",
}) => {
  // Responsive indent: use CSS calc for better mobile support
  const indentStyle = {
    marginLeft: `${level * indentSize}px`,
  };

  if (!hasChildren) {
    return (
      <div
        className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mr-1.5 sm:mr-2 ${className}`}
        style={indentStyle}
      />
    );
  }

  return (
    <button
      type="button"
      className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 min-w-4 sm:min-w-5 min-h-4 sm:min-h-5 mt-0.5 rounded-md transition-all duration-200 shrink-0 mr-1.5 sm:mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${className}`}
      style={indentStyle}
      onClick={onClick}
      title={isExpanded ? "Tutup" : "Buka"}
      aria-label={isExpanded ? "Tutup" : "Buka"}
      aria-expanded={isExpanded}
    >
      <ChevronDownIcon
        className={`w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0 transition-transform duration-200 ${
          isExpanded ? "rotate-0" : "-rotate-90"
        }`}
      />
    </button>
  );
};

