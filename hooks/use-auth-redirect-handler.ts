import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { getSupabaseClient } from '@/lib/supabase/client';
import { applySessionFromUrl, isAuthCallbackUrl } from '@/lib/supabase/session';

export function useAuthRedirectHandler() {
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const client = supabase;

    async function handleUrl(url: string | null | undefined) {
      if (!url || lastUrl.current === url || !isAuthCallbackUrl(url)) return;
      lastUrl.current = url;
      try {
        await applySessionFromUrl(client, url);
      } catch (error) {
        Alert.alert(
          'Authentication failed',
          error instanceof Error ? error.message : 'Could not finish sign in.'
        );
      }
    }

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
