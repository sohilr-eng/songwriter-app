import { useEffect, useState } from 'react';
import { getAlbumById, getSongsInAlbum } from '@/db/albums';
import { subscribe } from '@/db/events';
import type { AlbumRow, SongRow } from '@/types/song';

export interface AlbumDetail {
  album: AlbumRow;
  songs: SongRow[];
}

export function useAlbum(id: string): AlbumDetail | null {
  const [detail, setDetail] = useState<AlbumDetail | null>(null);

  async function load() {
    const album = await getAlbumById(id);
    if (!album) return;
    const songs = await getSongsInAlbum(id);
    setDetail({ album, songs });
  }

  useEffect(() => {
    load();
    const unsub = subscribe(`album:${id}`, load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return detail;
}
