import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { Album, SongSummary } from '@/types/song';

export interface AlbumDetail {
  album: Album;
  songs: SongSummary[];
}

export function useAlbum(id: string): AlbumDetail | null {
  const [detail, setDetail] = useState<AlbumDetail | null>(null);

  async function load() {
    const album = await repositories.albums.getById(id);
    if (!album) return;
    const songs = await repositories.albums.listSongs(id);
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
