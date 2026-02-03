/**
 * ProtectedRoute component for authentication-required pages.
 *
 * Handles:
 * - Loading state while auth is being determined
 * - Redirect to login if not authenticated
 * - Optional returnUrl to redirect back after login
 *
 * Usage:
 * ```tsx
 * <Route
 *   path="/account"
 *   element={
 *     <ProtectedRoute>
 *       <Account />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Custom redirect path (defaults to /login) */
  redirectTo?: string;
  /** Whether to include return URL in redirect (defaults to true) */
  includeReturnUrl?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  includeReturnUrl = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <main style={{ padding: '120px 0 80px', minHeight: '100vh' }}>
        <div className="app-container" style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
        </div>
      </main>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const redirectPath = includeReturnUrl
      ? `${redirectTo}?returnUrl=${encodeURIComponent(location.pathname)}`
      : redirectTo;

    return <Navigate to={redirectPath} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
