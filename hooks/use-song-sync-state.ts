import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { getSyncState } from '@/db/sync-state';
import type { LocalSyncState } from '@/types/sync';

export function useSongSyncState(songId: string) {
  const [state, setState] = useState<LocalSyncState | null>(null);

  useEffect(() => {
    async function load() {
      const next = await getSyncState('song', songId);
      setState(next);
    }

    void load();
    return subscribe(`song:${songId}`, () => {
      void load();
    });
  }, [songId]);

  return state;
}
