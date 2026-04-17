import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createInvite,
  getInvitesForSong,
  revokeInvite,
  type SongInvite,
} from '@/lib/supabase/invites';

export interface UseSongInvitesResult {
  invites: SongInvite[];
  loading: boolean;
  creating: boolean;
  create: (role?: 'viewer' | 'editor') => Promise<SongInvite | null>;
  revoke: (inviteId: string) => Promise<void>;
  error: string | null;
}

export function useSongInvites(userId: string | undefined, songId: string): UseSongInvitesResult {
  const [invites, setInvites] = useState<SongInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getInvitesForSong(supabase, userId, songId);
      setInvites(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites.');
    } finally {
      setLoading(false);
    }
  }, [userId, songId]);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(async (role: 'viewer' | 'editor' = 'viewer') => {
    if (!userId) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    setCreating(true);
    setError(null);
    try {
      const invite = await createInvite(supabase, userId, songId, role);
      setInvites((prev) => [invite, ...prev]);
      return invite;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite.');
      return null;
    } finally {
      setCreating(false);
    }
  }, [userId, songId]);

  const revoke = useCallback(async (inviteId: string) => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await revokeInvite(supabase, userId, inviteId);
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invite.');
    }
  }, [userId]);

  return { invites, loading, creating, create, revoke, error };
}
