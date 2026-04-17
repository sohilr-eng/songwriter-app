import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { SongSummary } from '@/types/song';

export function useAlbumSongs(albumId: string): SongSummary[] {
  const [songs, setSongs] = useState<SongSummary[]>([]);

  async function load() {
    const rows = await repositories.albums.listSongs(albumId);
    setSongs(rows);
  }

  useEffect(() => {
    load();
    const unsub = subscribe(`album:${albumId}`, load);
    return unsub;
  }, [albumId]);

  return songs;
}
