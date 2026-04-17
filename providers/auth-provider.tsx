import { useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthProviderValue } from '@/contexts/auth-context';
import { getSupabaseClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchProfile } from '@/lib/supabase/profile';
import type { AuthState } from '@/types/auth';

const baseState: AuthState = {
  isConfigured: false,
  isLoading: false,
  session: null,
  user: null,
  profile: null,
  refresh: async () => {},
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(baseState);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    const supabase = getSupabaseClient();

    if (!configured || !supabase) {
      setState(baseState);
      return;
    }

    const client = supabase;
    let active = true;

    async function refresh() {
      const { data } = await client.auth.getSession();
      if (!active) return;
      await loadSessionAndProfile(data.session);
    }

    async function loadSessionAndProfile(session: Session | null) {
      const user = session?.user ?? null;

      setState((current) => ({
        ...current,
        isConfigured: true,
        isLoading: true,
        session,
        user,
      }));

      try {
        const profile = user ? await fetchProfile(client, user.id) : null;
        if (!active) return;

        setState({
          isConfigured: true,
          isLoading: false,
          session,
          user,
          profile,
          refresh,
        });
      } catch {
        if (!active) return;

        setState({
          isConfigured: true,
          isLoading: false,
          session,
          user,
          profile: null,
          refresh,
        });
      }
    }

    void refresh();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void loadSessionAndProfile(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthProviderValue value={state}>{children}</AuthProviderValue>;
}
