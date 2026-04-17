import type { LocalSyncState } from '@/types/sync';

export type SongSyncIssueKind =
  | 'auth'
  | 'configuration'
  | 'network'
  | 'storage'
  | 'remote_missing'
  | 'unknown';

export interface SongSyncIssue {
  kind: SongSyncIssueKind;
  title: string;
  detail: string;
  canRetry: boolean;
}

function normalizeMessage(message: string | null | undefined): string {
  return (message ?? '').trim();
}

export function getSongSyncIssue(state: LocalSyncState | null): SongSyncIssue | null {
  if (!state || state.syncStatus !== 'conflict') {
    return null;
  }

  const detail = normalizeMessage(state.lastError) || 'Cloud sync needs attention.';
  const lower = detail.toLowerCase();

  if (
    lower.includes('jwt') ||
    lower.includes('session') ||
    lower.includes('not authenticated') ||
    lower.includes('sign in') ||
    lower.includes('auth')
  ) {
    return {
      kind: 'auth',
      title: 'Account session needs attention',
      detail,
      canRetry: true,
    };
  }

  if (
    lower.includes('not configured') ||
    lower.includes('publishable key') ||
    lower.includes('anon key') ||
    lower.includes('supabase unavailable') ||
    lower.includes('supabase is not configured')
  ) {
    return {
      kind: 'configuration',
      title: 'Cloud configuration is incomplete',
      detail,
      canRetry: false,
    };
  }

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('offline')
  ) {
    return {
      kind: 'network',
      title: 'Network interrupted sync',
      detail,
      canRetry: true,
    };
  }

  if (
    lower.includes('storage') ||
    lower.includes('bucket') ||
    lower.includes('object') ||
    lower.includes('recording') ||
    lower.includes('signed url')
  ) {
    return {
      kind: 'storage',
      title: 'Audio backup needs attention',
      detail,
      canRetry: true,
    };
  }

  if (
    lower.includes('0 rows') ||
    lower.includes('no rows') ||
    lower.includes('not found') ||
    lower.includes('does not exist')
  ) {
    return {
      kind: 'remote_missing',
      title: 'Cloud copy is out of sync',
      detail,
      canRetry: true,
    };
  }

  return {
    kind: 'unknown',
    title: 'Cloud sync needs attention',
    detail,
    canRetry: true,
  };
}

export function describeSongSyncState(state: LocalSyncState | null): string {
  if (!state) {
    return 'This song has not been backed up yet.';
  }

  if (state.syncStatus === 'synced') {
    return `Backed up to cloud. Sync version ${state.syncVersion}.`;
  }

  if (state.syncStatus === 'pending_push') {
    return 'Local changes exist and still need to be pushed.';
  }

  if (state.syncStatus === 'conflict') {
    return getSongSyncIssue(state)?.detail ?? 'Cloud sync needs attention before the next push.';
  }

  return 'This song exists locally only.';
}
