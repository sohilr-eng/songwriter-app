import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  acquireEditLock,
  getEditLock,
  releaseEditLock,
  revokeEditLock,
  type EditLock,
} from '@/lib/supabase/edit-locks';

export interface UseEditLockResult {
  lock: EditLock | null;
  loading: boolean;
  acquiring: boolean;
  releasing: boolean;
  revoking: boolean;
  isMine: boolean;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  revoke: () => Promise<void>;
  refresh: () => void;
  error: string | null;
}

export function useEditLock(userId: string | undefined, songId: string): UseEditLockResult {
  const [lock, setLock] = useState<EditLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getEditLock(supabase, songId)
      .then((result) => { if (!cancelled) setLock(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load lock state.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId, songId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const acquire = useCallback(async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    setAcquiring(true);
    setError(null);
    try {
      const granted = await acquireEditLock(supabase, songId);
      if (granted) {
        setTick((t) => t + 1);
      }
      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acquire lock.');
      return false;
    } finally {
      setAcquiring(false);
    }
  }, [songId]);

  const release = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setReleasing(true);
    setError(null);
    try {
      await releaseEditLock(supabase, songId);
      setLock(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release lock.');
    } finally {
      setReleasing(false);
    }
  }, [songId]);

  const revoke = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setRevoking(true);
    setError(null);
    try {
      await revokeEditLock(supabase, songId);
      setLock(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke lock.');
    } finally {
      setRevoking(false);
    }
  }, [songId]);

  const isMine = !!lock && !!userId && lock.heldBy === userId && lock.isActive;

  return { lock, loading, acquiring, releasing, revoking, isMine, acquire, release, revoke, refresh, error };
}
