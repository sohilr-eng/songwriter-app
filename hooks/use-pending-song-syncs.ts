import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { listSongSyncStates } from '@/db/sync-state';
import type { LocalSyncState } from '@/types/sync';

export function usePendingSongSyncs() {
  const [songs, setSongs] = useState<LocalSyncState[]>([]);

  useEffect(() => {
    async function load() {
      const next = await listSongSyncStates(['pending_push', 'conflict']);
      setSongs(next);
    }

    void load();
    return subscribe('sync_state', () => {
      void load();
    });
  }, []);

  return songs;
}
