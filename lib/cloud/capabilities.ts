import type { AuthState } from '@/types/auth';

export interface CloudCapabilities {
  isConfigured: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  needsProfileCompletion: boolean;
  canUseCloudFeatures: boolean;
  accountTitle: string;
  accountDescription: string;
}

export function getCloudCapabilities(auth: AuthState): CloudCapabilities {
  const isConfigured = auth.isConfigured;
  const isAuthenticated = Boolean(auth.user);
  const hasProfile = Boolean(auth.profile);
  const needsProfileCompletion = isAuthenticated && !auth.profile?.displayName;
  const canUseCloudFeatures = isConfigured && isAuthenticated;

  if (!isConfigured) {
    return {
      isConfigured,
      isAuthenticated,
      hasProfile,
      needsProfileCompletion,
      canUseCloudFeatures,
      accountTitle: 'Supabase not configured',
      accountDescription:
        'Add your Supabase URL and publishable key to enable account, backup, and collaboration work.',
    };
  }

  if (auth.isLoading) {
    return {
      isConfigured,
      isAuthenticated,
      hasProfile,
      needsProfileCompletion,
      canUseCloudFeatures,
      accountTitle: 'Checking session...',
      accountDescription: 'Looking for an existing account session on this device.',
    };
  }

  if (!isAuthenticated) {
    return {
      isConfigured,
      isAuthenticated,
      hasProfile,
      needsProfileCompletion,
      canUseCloudFeatures,
      accountTitle: 'Not signed in',
      accountDescription: 'Local drafting still works. Sign in to unlock backup, sharing, and collaboration.',
    };
  }

  if (needsProfileCompletion) {
    return {
      isConfigured,
      isAuthenticated,
      hasProfile,
      needsProfileCompletion,
      canUseCloudFeatures,
      accountTitle: 'Signed in',
      accountDescription: 'Finish your public profile so collaborators can recognize your work later.',
    };
  }

  return {
    isConfigured,
    isAuthenticated,
    hasProfile,
    needsProfileCompletion,
    canUseCloudFeatures,
    accountTitle: 'Signed in',
    accountDescription: auth.user?.email ?? 'Cloud features are available on this device.',
  };
}
