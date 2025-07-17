
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="flex min-h-screen">
      <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          isCollapsed ? "ml-0 lg:ml-16" : "ml-0 lg:ml-64"
        )}
      >
        <main className="h-full w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
