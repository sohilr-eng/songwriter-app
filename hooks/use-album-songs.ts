import { useEffect, useState } from 'react';
import { getSongsInAlbum } from '@/db/albums';
import { subscribe } from '@/db/events';
import type { SongRow } from '@/types/song';

export function useAlbumSongs(albumId: string): SongRow[] {
  const [songs, setSongs] = useState<SongRow[]>([]);

  async function load() {
    const rows = await getSongsInAlbum(albumId);
    setSongs(rows);
  }

  useEffect(() => {
    load();
    const unsub = subscribe(`album:${albumId}`, load);
    return unsub;
  }, [albumId]);

  return songs;
}
