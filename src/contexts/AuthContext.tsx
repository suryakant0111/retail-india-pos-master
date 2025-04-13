
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  loginWithGoogle: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isManager: false,
  session: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          // For demo, we're still using mockUsers, but in a real app
          // you would fetch user data from Supabase
          const foundUser = mockUsers.find(u => u.email.toLowerCase() === currentSession.user.email);
          if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('pos_user', JSON.stringify(foundUser));
          }
        } else {
          setUser(null);
          localStorage.removeItem('pos_user');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const savedUser = localStorage.getItem('pos_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        } else {
          // If no saved user, try to find user in mockUsers by email
          const foundUser = mockUsers.find(u => u.email.toLowerCase() === currentSession.user.email);
          if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('pos_user', JSON.stringify(foundUser));
          }
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // For demo purposes, we're using mock data and not validating password
    // In a real app, this would be an API call
    try {
      setIsLoading(true);
      
      // Attempt to login with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Fallback to mock users for demo
        const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('pos_user', JSON.stringify(foundUser));
          toast({
            title: "Login successful",
            description: `Welcome back, ${foundUser.name}!`,
            variant: "default",
          });
          return true;
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
          return false;
        }
      }
      
      // Successful Supabase login
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) {
        toast({
          title: "Google login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred with Google login",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('pos_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isManager = isAuthenticated && (user?.role === 'manager' || user?.role === 'admin');

  const value = {
    user,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated,
    isAdmin,
    isManager,
    session,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
