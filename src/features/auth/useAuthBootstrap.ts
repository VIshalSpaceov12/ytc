import { useEffect } from 'react';
import { supabase } from '@/data/supabase';
import { useAuthStore } from './authStore';

export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, [setSession]);
}
