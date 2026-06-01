import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

// ============================================
// TYPES
// ============================================
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ============================================
// CONTEXT
// ============================================
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

const BG_COLORS: Record<ToastType, string> = {
  success: 'border-emerald-100 bg-white',
  error: 'border-rose-100 bg-white',
  info: 'border-blue-100 bg-white',
  warning: 'border-amber-100 bg-white',
};

// ============================================
// PROVIDER
// ============================================
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container - fixed bottom right */}
      <div
        className="fixed bottom-6 right-4 z-[200] flex flex-col gap-3 items-end pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl border shadow-xl max-w-sm w-full
              animate-in slide-in-from-right-4 fade-in duration-300
              ${BG_COLORS[toast.type]}`}
          >
            {/* Icon bubble */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${COLORS[toast.type]}`}>
              {ICONS[toast.type]}
            </div>

            <p className="flex-1 text-gray-800 font-bold text-sm leading-snug">
              {toast.message}
            </p>

            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition p-1 flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useToast = () => useContext(ToastContext);

export default ToastProvider;
