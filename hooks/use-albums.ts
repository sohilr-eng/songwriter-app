import { useSyncExternalStore } from 'react';
import { getAllAlbums } from '@/db/albums';
import { subscribe } from '@/db/events';
import type { AlbumRow } from '@/types/song';

let cache: AlbumRow[] = [];
let loaded = false;

function load(cb?: () => void) {
  getAllAlbums().then(rows => {
    cache = rows;
    loaded = true;
    cb?.();
  });
}

function subscribeToAlbums(cb: () => void) {
  const unsub = subscribe('albums', () => {
    getAllAlbums().then(rows => { cache = rows; cb(); });
  });
  if (!loaded) load();
  return unsub;
}

function getSnapshot() { return cache; }

export function useAlbums(): AlbumRow[] {
  return useSyncExternalStore(subscribeToAlbums, getSnapshot, getSnapshot);
}
