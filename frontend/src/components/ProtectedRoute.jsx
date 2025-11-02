import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectIsAdmin } from '../store/authSlice';

export default function ProtectedRoute({ children, requireRole }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireRole === 'admin' && !isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
