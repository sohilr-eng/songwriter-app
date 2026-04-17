import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { useCloudCapabilities } from '@/hooks/use-cloud-capabilities';
import { usePendingSongSyncs } from '@/hooks/use-pending-song-syncs';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  resetOwnerSyncStatus,
  updateOwnerSyncStatus,
} from '@/lib/sync/owner-sync-status';
import { syncPendingSongs } from '@/lib/supabase/sync-coordinator';

const SUCCESS_RETRY_COOLDOWN_MS = 15_000;
const FAILURE_RETRY_COOLDOWN_MS = 60_000;

export function OwnerSyncBootstrap() {
  const auth = useAuth();
  const cloud = useCloudCapabilities();
  const pendingSongSyncs = usePendingSongSyncs();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const running = useRef(false);
  const lastAttemptAt = useRef<number>(0);
  const lastFailureAt = useRef<number | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = auth.user?.id ?? null;
  const pendingCount = pendingSongSyncs.length;
  const isActive = appState === 'active';
  const shouldAttempt = useMemo(
    () =>
      !!userId &&
      cloud.canUseCloudFeatures &&
      !auth.isLoading &&
      pendingCount > 0 &&
      isActive,
    [auth.isLoading, cloud.canUseCloudFeatures, isActive, pendingCount, userId]
  );

  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const attemptSync = useCallback(async () => {
    if (!shouldAttempt || running.current || !userId) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    running.current = true;
    clearRetryTimer();
    lastAttemptAt.current = Date.now();
    updateOwnerSyncStatus((current) => ({
      ...current,
      phase: 'syncing',
      pendingCount,
      lastAttemptAt: lastAttemptAt.current,
    }));

    try {
      const result = await syncPendingSongs(supabase, userId);
      lastFailureAt.current = result.failed.length > 0 ? Date.now() : null;
      updateOwnerSyncStatus((current) => ({
        ...current,
        phase: pendingCount > 0 ? 'scheduled' : 'idle',
        pendingCount,
        lastSuccessAt: result.failed.length === 0 ? Date.now() : current.lastSuccessAt,
        lastFailureAt: result.failed.length > 0 ? lastFailureAt.current : null,
        lastResult: {
          attempted: result.attempted,
          synced: result.synced,
          failedCount: result.failed.length,
        },
      }));
    } catch {
      lastFailureAt.current = Date.now();
      updateOwnerSyncStatus((current) => ({
        ...current,
        phase: 'scheduled',
        pendingCount,
        lastFailureAt: lastFailureAt.current,
      }));
    } finally {
      running.current = false;
    }
  }, [clearRetryTimer, pendingCount, shouldAttempt, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!shouldAttempt) {
      clearRetryTimer();
      updateOwnerSyncStatus((current) => ({
        ...current,
        phase: 'idle',
        pendingCount,
      }));
      return;
    }

    const now = Date.now();
    const cooldownMs = lastFailureAt.current ? FAILURE_RETRY_COOLDOWN_MS : SUCCESS_RETRY_COOLDOWN_MS;
    const retryAt = lastAttemptAt.current + cooldownMs;
    const waitMs = Math.max(0, retryAt - now);

    if (lastAttemptAt.current === 0 || waitMs === 0) {
      void attemptSync();
      return;
    }

    clearRetryTimer();
    updateOwnerSyncStatus((current) => ({
      ...current,
      phase: 'scheduled',
      pendingCount,
    }));
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      void attemptSync();
    }, waitMs);

    return () => {
      clearRetryTimer();
    };
  }, [attemptSync, clearRetryTimer, pendingCount, shouldAttempt]);

  useEffect(() => {
    if (!userId) {
      running.current = false;
      lastAttemptAt.current = 0;
      lastFailureAt.current = null;
      clearRetryTimer();
      resetOwnerSyncStatus();
    }
  }, [clearRetryTimer, userId]);

  return null;
}
