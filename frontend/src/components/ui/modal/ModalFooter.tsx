import { ReactNode } from "react";

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * ModalFooter - Reusable modal footer component for action buttons
 * 
 * @example
 * ```tsx
 * <ModalFooter>
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </ModalFooter>
 * ```
 */
export default function ModalFooter({
  children,
  className = "",
}: ModalFooterProps) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 px-0 sm:px-2 mt-4 sm:mt-6 sm:justify-end ${className}`}>
      {children}
    </div>
  );
}

