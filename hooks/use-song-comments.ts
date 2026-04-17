import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createComment,
  deleteComment,
  getCommentsForSong,
  type SongComment,
} from '@/lib/supabase/comments';

export interface UseSongCommentsResult {
  comments: SongComment[];
  loading: boolean;
  submitting: boolean;
  submit: (body: string) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
  error: string | null;
}

export function useSongComments(userId: string | undefined, songId: string): UseSongCommentsResult {
  const [comments, setComments] = useState<SongComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCommentsForSong(supabase, songId)
      .then((result) => { if (!cancelled) setComments(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load comments.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId, songId]);

  const submit = useCallback(async (body: string) => {
    if (!userId) return;
    const trimmed = body.trim();
    if (!trimmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSubmitting(true);
    setError(null);
    try {
      const comment = await createComment(supabase, userId, songId, trimmed);
      setComments((prev) => [...prev, comment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }, [userId, songId]);

  const remove = useCallback(async (commentId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await deleteComment(supabase, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment.');
    }
  }, []);

  return { comments, loading, submitting, submit, remove, error };
}
