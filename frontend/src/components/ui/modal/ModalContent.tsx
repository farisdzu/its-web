import { ReactNode } from "react";

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

/**
 * ModalContent - Reusable modal content wrapper component
 * 
 * @example
 * ```tsx
 * <ModalContent maxWidth="600px">
 *   <ModalHeader title="Form" />
 *   <form>...</form>
 * </ModalContent>
 * ```
 */
export default function ModalContent({
  children,
  className = "",
  maxWidth = "600px",
}: ModalContentProps) {
  return (
    <div
      className={`no-scrollbar relative w-full overflow-y-auto rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 dark:bg-gray-900 lg:p-8 ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
}

