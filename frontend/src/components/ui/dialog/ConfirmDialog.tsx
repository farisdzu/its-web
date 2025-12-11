import { ReactNode } from "react";
import { Modal } from "../modal";
import Button from "../button/Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * ConfirmDialog - Reusable confirmation dialog component
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleConfirm}
 *   title="Hapus Item"
 *   message="Apakah Anda yakin ingin menghapus item ini?"
 *   variant="danger"
 *   isLoading={deleting}
 * />
 * ```
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "default",
  isLoading = false,
  disabled = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md m-4"
      showCloseButton={false}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {typeof message === "string" ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {typeof description === "string" ? (
                <p>{description}</p>
              ) : (
                description
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || disabled}
            type="button"
          >
            {cancelText}
          </Button>
          {variant === "default" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={handleConfirm}
              disabled={isLoading || disabled}
              type="button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || disabled}
              className={`inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-3 text-sm ${
                variant === "danger"
                  ? "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300 disabled:cursor-not-allowed disabled:opacity-50"
                  : "bg-warning-500 text-white shadow-theme-xs hover:bg-warning-600 disabled:bg-warning-300 disabled:cursor-not-allowed disabled:opacity-50"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                confirmText
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

