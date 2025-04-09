
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface AuthGuardProps {
  requireAdmin?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect to dashboard if admin access is required but user is not admin
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 ml-64">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
