import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';

export default function ProtectedRoute({ children, requireAuth = true }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto bg-slate-800" />
          <Skeleton className="h-4 w-48 mx-auto bg-slate-800" />
          <Skeleton className="h-4 w-32 mx-auto bg-slate-800" />
        </div>
      </div>
    );
  }

  // If route requires authentication but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is for non-authenticated users but user is authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Higher-order component for protecting routes
export const withAuth = (Component, requireAuth = true) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute requireAuth={requireAuth}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};