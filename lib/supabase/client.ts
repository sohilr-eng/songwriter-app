import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { getSupabaseConfig } from './config';

let singleton: SupabaseClient | null = null;
let autoRefreshBound = false;

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function createSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createClient(config.url, config.publishableKey, {
    auth: {
      storage: Platform.OS === 'web' ? AsyncStorage : (secureStoreAdapter as typeof AsyncStorage),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  singleton ??= createSupabaseClient();
  return singleton;
}

export function bindSupabaseAutoRefresh(): void {
  const supabase = getSupabaseClient();
  if (!supabase || autoRefreshBound || Platform.OS === 'web') return;

  autoRefreshBound = true;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
