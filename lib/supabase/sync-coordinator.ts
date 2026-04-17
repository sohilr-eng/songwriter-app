import type { SupabaseClient } from '@supabase/supabase-js';
import { listSongSyncStates } from '@/db/sync-state';
import { pushSongToCloud } from '@/lib/supabase/song-sync';

export interface SongSyncBatchResult {
  attempted: number;
  synced: number;
  failed: Array<{ songId: string; message: string }>;
}

export async function backupSongsToCloud(
  supabase: SupabaseClient,
  userId: string,
  songIds: string[]
): Promise<SongSyncBatchResult> {
  let synced = 0;
  const failed: Array<{ songId: string; message: string }> = [];

  for (const songId of songIds) {
    try {
      await pushSongToCloud(supabase, userId, songId);
      synced += 1;
    } catch (error) {
      failed.push({
        songId,
        message: error instanceof Error ? error.message : 'Cloud sync failed.',
      });
    }
  }

  return {
    attempted: songIds.length,
    synced,
    failed,
  };
}

export async function syncPendingSongs(
  supabase: SupabaseClient,
  userId: string
): Promise<SongSyncBatchResult> {
  const pendingSongs = await listSongSyncStates(['pending_push', 'conflict']);
  return backupSongsToCloud(
    supabase,
    userId,
    pendingSongs.map((song) => song.entityId)
  );
}
