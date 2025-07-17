import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart4, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Clock,
  Tag,
  Layers,
  Goal,
  Store,
  Scale,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefetch } from '@/hooks/usePrefetch';

interface SidebarItemProps {
  icon: React.ElementType;
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  href, 
  label, 
  active, 
  onClick,
  onMouseEnter,
  onMouseLeave,
  isCollapsed
}) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 mb-1 relative group',
        active
          ? 'bg-sidebar-accent text-white shadow-lg'
          : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:shadow-md'
      )}
      title={isCollapsed ? label : ''}
    >
      <Icon className={cn(
        'h-5 w-5 transition-all duration-200',
        isCollapsed ? 'mx-auto' : 'mr-3'
      )} />
      <span className={cn(
        'transition-all duration-200 whitespace-nowrap',
        isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
      )}>
        {label}
      </span>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  );
};

export interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { prefetchData, cancelPrefetch } = usePrefetch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const role = profile?.role;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-md shadow-lg lg:hidden transition-all duration-200 hover:bg-sidebar-accent"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* Sidebar */}
      <div className={cn(
        'h-screen flex flex-col bg-sidebar fixed left-0 top-0 bottom-0 z-50 overflow-hidden transition-all duration-300 ease-in-out shadow-xl',
        isMobile ? (
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        ) : (
          `translate-x-0 ${sidebarWidth}`
        )
      )}>
        {/* Header */}
        <div className={cn(
          'p-6 flex-shrink-0 transition-all duration-300',
          isCollapsed && !isMobile ? 'p-4' : 'p-6'
        )}>
          <div className="flex items-center justify-between">
            <div className={cn(
              'transition-all duration-300',
              isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              <h1 className="text-2xl font-bold text-white">Retail POS</h1>
              <div className="text-sidebar-foreground/80 mt-1">Point of Sale System</div>
            </div>
            
            {/* Collapse Toggle for Desktop */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-200"
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}
          </div>
          
          {/* Collapsed Logo */}
          {isCollapsed && !isMobile && (
            <div className="flex justify-center mt-2">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
          <nav className="space-y-1">
            {/* All users have access to POS, Products, and Customers */}
            <SidebarItem 
              icon={ShoppingCart} 
              href="/pos" 
              label="Point of Sale" 
              active={isActive('/pos')}
              onMouseEnter={() => prefetchData('/pos')}
              onMouseLeave={() => cancelPrefetch('/pos')}
              isCollapsed={isCollapsed && !isMobile}
            />
            <SidebarItem 
              icon={Package} 
              href="/products" 
              label="Products" 
              active={isActive('/products')}
              onMouseEnter={() => prefetchData('/products')}
              onMouseLeave={() => cancelPrefetch('/products')}
              isCollapsed={isCollapsed && !isMobile}
            />
            <SidebarItem 
              icon={Users} 
              href="/customers" 
              label="Customers" 
              active={isActive('/customers')}
              onMouseEnter={() => prefetchData('/customers')}
              onMouseLeave={() => cancelPrefetch('/customers')}
              isCollapsed={isCollapsed && !isMobile}
            />

            {/* Dashboard only for admin */}
            {role === 'admin' && (
              <SidebarItem 
                icon={BarChart4} 
                href="/dashboard" 
                label="Dashboard" 
                active={isActive('/dashboard')}
                onMouseEnter={() => prefetchData('/dashboard')}
                onMouseLeave={() => cancelPrefetch('/dashboard')}
                isCollapsed={isCollapsed && !isMobile}
              />
            )}
            {/* Invoices and Transactions for admin and manager */}
            {(role === 'admin' || role === 'manager') && (
              <>
                <SidebarItem 
                  icon={FileText} 
                  href="/invoices" 
                  label="Invoices" 
                  active={isActive('/invoices')}
                  onMouseEnter={() => prefetchData('/invoices')}
                  onMouseLeave={() => cancelPrefetch('/invoices')}
                  isCollapsed={isCollapsed && !isMobile}
                />
                <SidebarItem 
                  icon={Clock} 
                  href="/transactions" 
                  label="Transactions" 
                  active={isActive('/transactions')}
                  onMouseEnter={() => prefetchData('/transactions')}
                  onMouseLeave={() => cancelPrefetch('/transactions')}
                  isCollapsed={isCollapsed && !isMobile}
                />
              </>
            )}

            {/* Only admin has access to Settings, and Admin */}
            {role === 'admin' && (
              <>
                {!(isCollapsed && !isMobile) && (
                  <div className="pt-4 pb-2">
                    <div className="px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                      Admin
                    </div>
                  </div>
                )}
                {(isCollapsed && !isMobile) && (
                  <div className="pt-4 pb-2">
                    <div className="h-px bg-sidebar-foreground/20 mx-2"></div>
                  </div>
                )}
                <SidebarItem 
                  icon={Settings} 
                  href="/settings" 
                  label="Settings" 
                  active={isActive('/settings')}
                  onMouseEnter={() => prefetchData('/settings')}
                  onMouseLeave={() => cancelPrefetch('/settings')}
                  isCollapsed={isCollapsed && !isMobile}
                />
                <SidebarItem 
                  icon={Layers} 
                  href="/admin" 
                  label="Admin Panel" 
                  active={isActive('/admin')}
                  onMouseEnter={() => prefetchData('/admin')}
                  onMouseLeave={() => cancelPrefetch('/admin')}
                  isCollapsed={isCollapsed && !isMobile}
                />
              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <div className={cn(
            'flex items-center mb-4 transition-all duration-300',
            isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
          )}>
            <div className="h-10 w-10 rounded-full bg-sidebar-accent/30 flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
              <span className="text-sidebar-foreground font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={cn(
              'transition-all duration-300',
              isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              <p className="text-sidebar-foreground font-medium truncate">{user?.email}</p>
              <p className="text-sidebar-foreground/60 text-sm capitalize">{role}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className={cn(
              'w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 hover:shadow-md',
              isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
            )}
            title={isCollapsed && !isMobile ? 'Logout' : ''}
          >
            <LogOut className={cn(
              'h-4 w-4 transition-all duration-200',
              isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'
            )} />
            <span className={cn(
              'transition-all duration-200',
              isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
};