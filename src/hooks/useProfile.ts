import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { profile, loading } = useAuth();
  // Optionally, you can add error handling if AuthContext provides it
  return { profile, loading };
} 