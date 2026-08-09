import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Tạo Context
const ToastContext = createContext(null);

// Các loại toast
const TOAST_TYPES = {
  success: { icon: CheckCircle, bgColor: 'bg-emerald-50 border-emerald-500', textColor: 'text-emerald-800', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, bgColor: 'bg-red-50 border-red-500', textColor: 'text-red-800', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, bgColor: 'bg-yellow-50 border-yellow-500', textColor: 'text-yellow-800', iconColor: 'text-yellow-500' },
  info: { icon: Info, bgColor: 'bg-blue-50 border-blue-500', textColor: 'text-blue-800', iconColor: 'text-blue-500' },
};

// Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map(t => {
          const config = TOAST_TYPES[t.type];
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 ${config.bgColor} border-${t.type === 'success' ? 'emerald' : t.type === 'error' ? 'red' : t.type === 'warning' ? 'yellow' : 'blue'}-500`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
              <p className={`text-sm flex-1 ${config.textColor}`}>{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-0.5 hover:bg-black/10 rounded"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Hook để dùng toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}