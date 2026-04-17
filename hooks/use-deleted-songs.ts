import { useSyncExternalStore } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { SongSummary } from '@/types/song';

let deletedCache: SongSummary[] = [];
let deletedListeners: Set<() => void> = new Set();
let deletedLoaded = false;

function notifyDeleted() {
  deletedListeners.forEach((listener) => listener());
}

function loadDeletedSongs() {
  repositories.songs.listDeleted().then((rows) => {
    deletedCache = rows;
    notifyDeleted();
  });
}

function ensureDeletedLoaded() {
  if (!deletedLoaded) {
    deletedLoaded = true;
    loadDeletedSongs();
  }
}

function subscribeToDeletedSongs(listener: () => void) {
  deletedListeners.add(listener);
  ensureDeletedLoaded();
  const unsubscribe = subscribe('songs', () => {
    loadDeletedSongs();
  });

  return () => {
    deletedListeners.delete(listener);
    unsubscribe();
  };
}

function getDeletedSnapshot() {
  return deletedCache;
}

export function useDeletedSongs(): SongSummary[] {
  return useSyncExternalStore(subscribeToDeletedSongs, getDeletedSnapshot, getDeletedSnapshot);
}
