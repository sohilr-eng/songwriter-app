import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMembersForSong, removeMember, type SongMember } from '@/lib/supabase/members';

export interface UseSongMembersResult {
  members: SongMember[];
  loading: boolean;
  removing: string | null;
  remove: (memberId: string) => Promise<void>;
  error: string | null;
}

export function useSongMembers(songId: string): UseSongMembersResult {
  const [members, setMembers] = useState<SongMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMembersForSong(supabase, songId)
      .then((result) => { if (!cancelled) setMembers(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load members.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [songId]);

  const remove = useCallback(async (memberId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setRemoving(memberId);
    setError(null);
    try {
      await removeMember(supabase, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  }, []);

  return { members, loading, removing, remove, error };
}
