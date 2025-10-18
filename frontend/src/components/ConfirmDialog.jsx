import React, { createContext, useCallback, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', resolve: null });

  const confirm = useCallback((message) => new Promise((resolve) => {
    setState({ open: true, message, resolve });
  }), []);

  const onClose = useCallback(() => {
    setState((s) => { s.resolve?.(false); return { open: false, message: '', resolve: null }; });
  }, []);
  const onConfirm = useCallback(() => {
    setState((s) => { s.resolve?.(true); return { open: false, message: '', resolve: null }; });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="confirm-overlay" onClick={onClose}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-message">{state.message}</div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="button button--ghost" onClick={onClose}>Hủy</button>
              <button className="button button--danger" onClick={onConfirm}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
