import type { SupabaseClient } from '@supabase/supabase-js';

export interface CloudSongSummary {
  id: string;
  title: string;
  key: string | null;
  bpm: number | null;
  updatedAt: number;
  syncVersion: number;
}

export async function listOwnedCloudSongs(
  supabase: SupabaseClient,
  userId: string
): Promise<CloudSongSummary[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('id, title, song_key, bpm, updated_at, sync_version')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    key: (row.song_key as string | null) ?? null,
    bpm: (row.bpm as number | null) ?? null,
    updatedAt: new Date(row.updated_at as string).getTime(),
    syncVersion: Number(row.sync_version ?? 0),
  }));
}
