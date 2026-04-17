import { useSyncExternalStore, useEffect } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { SongSummary } from '@/types/song';

let cache: SongSummary[] = [];
let listeners: Set<() => void> = new Set();

function notifyAll() {
  listeners.forEach(fn => fn());
}

function load() {
  repositories.songs.list().then(rows => {
    cache = rows;
    notifyAll();
  });
}

// Load once on first use
let initialLoaded = false;
function ensureLoaded() {
  if (!initialLoaded) {
    initialLoaded = true;
    load();
  }
}

function subscribeToSongs(cb: () => void) {
  listeners.add(cb);
  ensureLoaded();
  const unsub = subscribe('songs', () => {
    repositories.songs.list().then(rows => {
      cache = rows;
      notifyAll();
    });
  });
  return () => {
    listeners.delete(cb);
    unsub();
  };
}

function getSnapshot() {
  return cache;
}

export function useSongs(): SongSummary[] {
  return useSyncExternalStore(subscribeToSongs, getSnapshot, getSnapshot);
}
