import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
type Status = 'loading' | 'signed-in' | 'signed-out';
type AuthState = {
  session: Session | null;
  status: Status;
  userId: string | null;
  setSession: (s: Session | null) => void;
};
export const useAuthStore = create<AuthState>((set) => ({
  session: null, status: 'loading', userId: null,
  setSession: (s) => set({
    session: s,
    status: s ? 'signed-in' : 'signed-out',
    userId: s?.user?.id ?? null,
  }),
}));
