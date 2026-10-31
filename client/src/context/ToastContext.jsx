import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 bg-white px-4 py-3 text-sm shadow-lg ${
              t.type === 'error' ? 'border-red-600 text-red-800' : 'border-green-600 text-brown-900'
            }`}
          >
            {t.type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />}
            <p className="flex-1">{t.message}</p>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-brown-600 hover:text-brown-900">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
