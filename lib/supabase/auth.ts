import * as WebBrowser from 'expo-web-browser';
import type { Provider } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import {
  getAuthRedirectUrl,
  getNativeAuthRedirectSupportMessage,
  isNativeAuthRedirectSupported,
} from './redirect-url';
import { applySessionFromUrl } from './session';

WebBrowser.maybeCompleteAuthSession();

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

function toAuthErrorMessage(error: unknown, provider?: Provider): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('Unsupported provider: provider is not enabled')) {
      const providerLabel =
        provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'that provider';
      return `${providerLabel} sign-in is disabled in your Supabase project. Enable the ${providerLabel} provider in Supabase Auth settings first.`;
    }

    return message;
  }

  return 'Something went wrong.';
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(toAuthErrorMessage(error));
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const supabase = requireSupabase();
  if (!isNativeAuthRedirectSupported()) {
    throw new Error(getNativeAuthRedirectSupportMessage());
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      data: displayName?.trim()
        ? {
            display_name: displayName.trim(),
          }
        : undefined,
    },
  });

  if (error) throw new Error(toAuthErrorMessage(error));
  return data.session;
}

export async function signInWithOAuthProvider(provider: Provider) {
  const supabase = requireSupabase();
  if (!isNativeAuthRedirectSupported()) {
    throw new Error(getNativeAuthRedirectSupportMessage());
  }

  const redirectTo = getAuthRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(toAuthErrorMessage(error, provider));
  if (!data?.url) throw new Error(`No ${provider} sign-in URL was returned.`);

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  return applySessionFromUrl(supabase, result.url);
}
