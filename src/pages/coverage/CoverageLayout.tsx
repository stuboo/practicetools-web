/**
 * Coverage Layout
 * Wraps coverage routes with AuthProvider for authentication context
 */

import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';

/**
 * Layout wrapper that provides auth context for coverage pages.
 * Use this as the parent route element for coverage routes.
 */
export function CoverageLayout() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    </AuthProvider>
  );
}

/**
 * Layout wrapper for public coverage pages (login).
 * Provides auth context without requiring authentication.
 */
export function CoveragePublicLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
