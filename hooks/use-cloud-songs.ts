import { useCallback, useEffect, useState } from 'react';
import type { CloudSongSummary } from '@/lib/supabase/cloud-songs';
import { listOwnedCloudSongs } from '@/lib/supabase/cloud-songs';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useCloudSongs(userId: string | null | undefined) {
  const [songs, setSongs] = useState<CloudSongSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSongs([]);
      setError(null);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSongs([]);
      setError('Supabase is not configured.');
      return;
    }

    setLoading(true);
    try {
      const next = await listOwnedCloudSongs(supabase, userId);
      setSongs(next);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load cloud songs.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    songs,
    loading,
    error,
    refresh,
  };
}
