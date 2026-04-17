import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js';

export interface SessionParams {
  accessToken: string;
  refreshToken: string;
}

export interface OtpParams {
  tokenHash: string;
  type: EmailOtpType;
}

export interface AuthCallbackError {
  code: string | null;
  description: string;
}

function readParam(url: URL, key: string): string | null {
  const queryValue = url.searchParams.get(key);
  if (queryValue) return queryValue;

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  return hashParams.get(key);
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value === 'signup' ||
    value === 'invite' ||
    value === 'magiclink' ||
    value === 'recovery' ||
    value === 'email_change' ||
    value === 'email';
}

export function extractSessionParamsFromUrl(rawUrl: string): SessionParams | null {
  const url = new URL(rawUrl);
  const accessToken = readParam(url, 'access_token');
  const refreshToken = readParam(url, 'refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function extractOtpParamsFromUrl(rawUrl: string): OtpParams | null {
  const url = new URL(rawUrl);
  const tokenHash = readParam(url, 'token_hash');
  const type = readParam(url, 'type');

  if (!tokenHash || !isEmailOtpType(type)) {
    return null;
  }

  return { tokenHash, type };
}

export function extractAuthCallbackError(rawUrl: string): AuthCallbackError | null {
  const url = new URL(rawUrl);
  const description = readParam(url, 'error_description');
  const code = readParam(url, 'error_code');

  if (!description) {
    return null;
  }

  return {
    code,
    description: decodeURIComponent(description.replace(/\+/g, ' ')),
  };
}

export function isAuthCallbackUrl(rawUrl: string): boolean {
  return (
    extractSessionParamsFromUrl(rawUrl) !== null ||
    extractOtpParamsFromUrl(rawUrl) !== null ||
    extractAuthCallbackError(rawUrl) !== null
  );
}

export async function applySessionFromUrl(
  supabase: SupabaseClient,
  rawUrl: string
): Promise<boolean> {
  const authError = extractAuthCallbackError(rawUrl);
  if (authError) {
    throw new Error(authError.description);
  }

  const sessionParams = extractSessionParamsFromUrl(rawUrl);
  if (sessionParams) {
    const { error } = await supabase.auth.setSession({
      access_token: sessionParams.accessToken,
      refresh_token: sessionParams.refreshToken,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  const otpParams = extractOtpParamsFromUrl(rawUrl);
  if (!otpParams) return false;

  const { error } = await supabase.auth.verifyOtp({
    token_hash: otpParams.tokenHash,
    type: otpParams.type,
  });

  if (error) {
    throw error;
  }

  return true;
}
