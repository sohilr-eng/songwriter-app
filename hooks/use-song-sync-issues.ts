import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { listSongSyncStates } from '@/db/sync-state';
import { getSongSyncIssue } from '@/lib/sync/sync-issues';
import { repositories } from '@/repositories';
import type { SongSummary } from '@/types/song';
import type { LocalSyncState } from '@/types/sync';

export interface SongSyncIssueItem {
  song: SongSummary | null;
  syncState: LocalSyncState;
  issue: NonNullable<ReturnType<typeof getSongSyncIssue>>;
}

export function useSongSyncIssues() {
  const [issues, setIssues] = useState<SongSyncIssueItem[]>([]);

  useEffect(() => {
    async function load() {
      const [conflicts, songs, deletedSongs] = await Promise.all([
        listSongSyncStates(['conflict']),
        repositories.songs.list(),
        repositories.songs.listDeleted(),
      ]);

      const songMap = new Map<string, SongSummary>();
      for (const song of [...songs, ...deletedSongs]) {
        songMap.set(song.id, song);
      }

      const next = conflicts
        .map((syncState) => {
          const issue = getSongSyncIssue(syncState);
          if (!issue) return null;

          return {
            song: songMap.get(syncState.entityId) ?? null,
            syncState,
            issue,
          };
        })
        .filter((item): item is SongSyncIssueItem => !!item);

      setIssues(next);
    }

    void load();
    const unsubSync = subscribe('sync_state', () => {
      void load();
    });
    const unsubSongs = subscribe('songs', () => {
      void load();
    });

    return () => {
      unsubSync();
      unsubSongs();
    };
  }, []);

  return issues;
}
