
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  accessDenied: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role?: string) => Promise<any>;
  signOut: () => Promise<void>;
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, accessDenied, signIn, signUp, signOut }}>
      {accessDenied ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-muted-foreground mb-4">Your account is not yet approved by an admin. Please contact your administrator.</p>
        </div>
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
