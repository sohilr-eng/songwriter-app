import { useSyncExternalStore, useEffect } from 'react';
import { getAllSongs } from '@/db/songs';
import { subscribe } from '@/db/events';
import type { SongRow } from '@/types/song';

let cache: SongRow[] = [];
let listeners: Set<() => void> = new Set();

function notifyAll() {
  listeners.forEach(fn => fn());
}

function load() {
  getAllSongs().then(rows => {
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
    getAllSongs().then(rows => {
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

export function useSongs(): SongRow[] {
  return useSyncExternalStore(subscribeToSongs, getSnapshot, getSnapshot);
}
