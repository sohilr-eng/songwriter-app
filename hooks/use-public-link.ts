import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createPublicLink,
  getActiveLinkForSong,
  revokePublicLink,
  type PublicSongLink,
} from '@/lib/supabase/public-links';

export interface UsePublicLinkResult {
  link: PublicSongLink | null;
  loading: boolean;
  creating: boolean;
  revoking: boolean;
  create: () => Promise<void>;
  revoke: () => Promise<void>;
  error: string | null;
}

export function usePublicLink(userId: string | undefined, songId: string): UsePublicLinkResult {
  const [link, setLink] = useState<PublicSongLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getActiveLinkForSong(supabase, userId, songId)
      .then((result) => { if (!cancelled) setLink(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load share link.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId, songId]);

  const create = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setCreating(true);
    setError(null);
    try {
      const newLink = await createPublicLink(supabase, userId, songId);
      setLink(newLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link.');
    } finally {
      setCreating(false);
    }
  }, [userId, songId]);

  const revoke = useCallback(async () => {
    if (!userId || !link) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setRevoking(true);
    setError(null);
    try {
      await revokePublicLink(supabase, userId, link.id);
      setLink(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share link.');
    } finally {
      setRevoking(false);
    }
  }, [userId, link]);

  return { link, loading, creating, revoking, create, revoke, error };
}
