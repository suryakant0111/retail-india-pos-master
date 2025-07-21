
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  accessDenied: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error) {
      setProfile(data);
      if (data && data.status && data.status !== 'approved') {
        setAccessDenied(true);
      } else {
        setAccessDenied(false);
      }
    } else {
      setProfile(null);
      setAccessDenied(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) fetchProfile(data.user.id);
    return { data, error };
  };

  const signUp = async (email: string, password: string, role: string = 'shopkeeper') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (data.user) {
      // Insert profile with role
      await supabase.from('profiles').insert({ id: data.user.id, email, role });
      fetchProfile(data.user.id);
    }
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, accessDenied, signIn, signUp, signOut, resetPasswordForEmail }}>
      {accessDenied ? (
        <PendingApprovalScreen />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function PendingApprovalScreen() {
  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = (url) => window.location.assign(url);
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    if (navigate) {
      navigate('/login');
    } else {
      window.location.assign('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
      <p className="text-lg text-gray-600 mb-4">
        Your account is not yet approved by an admin. Please contact your administrator.
      </p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Log Out
      </button>
    </div>
  );
}
