export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv('EXPO_PUBLIC_SUPABASE_URL');
  const publishableKey =
    readEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
