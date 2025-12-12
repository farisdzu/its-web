import { useEffect, useState } from 'react';
import { CloseIcon } from '../../../icons';
import { Toast as ToastType } from '../../../context/ToastContext';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        // Wait for exit animation to complete before removing
        setTimeout(() => {
          onClose(toast.id);
        }, 300); // Match animation duration
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  // Toast variant styling
  const variant = toast.variant || 'success';
  const containerClass = variant === 'error' 
    ? 'bg-error-500 dark:bg-error-600' 
    : 'bg-success-500 dark:bg-success-600';
  const iconClass = 'text-white';
  const textClass = 'text-white';

  const successIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const errorIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const icon = variant === 'error' ? errorIcon : successIcon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg shadow-xl min-w-[320px] max-w-[420px] transition-all duration-300 ${
        isExiting ? 'animate-toast-slide-out' : 'animate-toast-slide-in'
      } ${containerClass}`}
      role="alert"
    >
      <div className={`shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${textClass}`}>{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className={`shrink-0 ${iconClass} hover:opacity-70 transition-opacity duration-200`}
        aria-label="Close"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

