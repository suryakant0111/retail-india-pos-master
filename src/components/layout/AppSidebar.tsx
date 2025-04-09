
import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, href, label, active, onClick }) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors mb-1',
        active
          ? 'bg-sidebar-accent text-white'
          : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      {label}
    </Link>
  );
};

export const AppSidebar = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen w-64 flex flex-col bg-sidebar fixed left-0 top-0 bottom-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Retail POS</h1>
        <div className="text-sidebar-foreground/80 mt-1">Point of Sale System</div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          <SidebarItem icon={BarChart4} href="/dashboard" label="Dashboard" active={isActive('/dashboard')} />
          <SidebarItem icon={ShoppingCart} href="/pos" label="Point of Sale" active={isActive('/pos')} />
          <SidebarItem icon={Package} href="/products" label="Products" active={isActive('/products')} />
          <SidebarItem icon={Users} href="/customers" label="Customers" active={isActive('/customers')} />
          <SidebarItem icon={FileText} href="/invoices" label="Invoices" active={isActive('/invoices')} />
          <SidebarItem icon={Clock} href="/transactions" label="Transactions" active={isActive('/transactions')} />
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  Admin
                </div>
              </div>
              <SidebarItem icon={Tag} href="/inventory" label="Inventory" active={isActive('/inventory')} />
              <SidebarItem icon={Settings} href="/settings" label="Settings" active={isActive('/settings')} />
            </>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-sidebar-accent/30 flex items-center justify-center overflow-hidden mr-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sidebar-foreground font-medium">
                {user?.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sidebar-foreground font-medium">{user?.name}</p>
            <p className="text-sidebar-foreground/60 text-sm capitalize">{user?.role}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};
