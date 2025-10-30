import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, message, timeout = 2200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, type, message }]);
    if (timeout) setTimeout(() => setToasts((list) => list.filter(t => t.id !== id)), timeout);
  }, []);
  const api = useMemo(() => ({
    success: (m, t) => add('success', m, t),
    error: (m, t) => add('error', m, t),
    info: (m, t) => add('info', m, t),
  }), [add]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
