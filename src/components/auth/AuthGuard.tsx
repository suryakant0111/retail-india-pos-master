
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface AuthGuardProps {
  requireAdmin?: boolean;
  requireManager?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  requireAdmin = false,
  requireManager = false
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin access is required but user is not admin
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }
  
  // Check if manager access is required but user is not manager or admin
  if (requireManager && profile?.role !== 'manager' && profile?.role !== 'admin') {
    return <Navigate to="/pos" replace />;
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
