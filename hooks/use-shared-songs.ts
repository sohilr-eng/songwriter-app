import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { listMemberSongs, type MemberSongSummary } from '@/lib/supabase/shared-songs';

export interface UseSharedSongsResult {
  songs: MemberSongSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSharedSongs(userId: string | undefined): UseSharedSongsResult {
  const [songs, setSongs] = useState<MemberSongSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) {
      setSongs([]);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    listMemberSongs(supabase)
      .then((result) => { if (!cancelled) setSongs(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shared songs.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { songs, loading, error, refresh };
}
