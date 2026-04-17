import { useSyncExternalStore } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { Album } from '@/types/song';

let cache: Album[] = [];
let loaded = false;

function load(cb?: () => void) {
  repositories.albums.list().then(rows => {
    cache = rows;
    loaded = true;
    cb?.();
  });
}

function subscribeToAlbums(cb: () => void) {
  const unsub = subscribe('albums', () => {
    repositories.albums.list().then(rows => { cache = rows; cb(); });
  });
  if (!loaded) load();
  return unsub;
}

function getSnapshot() { return cache; }

export function useAlbums(): Album[] {
  return useSyncExternalStore(subscribeToAlbums, getSnapshot, getSnapshot);
}
