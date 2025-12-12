import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  variant?: 'success' | 'error'; // Toast variant
  duration?: number; // in milliseconds, default 3000
}

interface ToastContextType {
  toasts: Toast[];
  removeToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration: number = 3000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, variant: 'success', duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showError = useCallback(
    (message: string, duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, variant: 'error', duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        removeToast,
        showSuccess,
        showError,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

