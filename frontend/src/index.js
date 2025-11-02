import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { Provider } from 'react-redux';
import { store } from './store';
import { hydrateFromStorage, logout as logoutAction } from './store/authSlice';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { logoutBackend } from './lib/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Force fresh login every app start: clear local auth and refresh cookie
try {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
} catch {}
store.dispatch(logoutAction());
// Clear backend refresh cookie as well
logoutBackend();

// After force clear, hydrate (will be empty)
store.dispatch(hydrateFromStorage());
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<App />} />
              <Route path="/register" element={<App />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }/>
              <Route path="/admin" element={
                <ProtectedRoute requireRole="admin">
                  <App />
                </ProtectedRoute>
              }/>
              {/* Fallback to root */}
              <Route path="*" element={<App />} />
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  </React.StrictMode>
);
