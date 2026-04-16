import { useSyncExternalStore } from 'react';
import { getAllIdeas } from '@/db/brainstorm';
import { subscribe } from '@/db/events';
import type { BrainstormRow } from '@/types/song';

let cache: BrainstormRow[] = [];
let loaded = false;

function subscribeToIdeas(cb: () => void) {
  const unsub = subscribe('brainstorm', () => {
    getAllIdeas().then(rows => { cache = rows; cb(); });
  });
  if (!loaded) {
    getAllIdeas().then(rows => { cache = rows; loaded = true; });
  }
  return unsub;
}

function getSnapshot() { return cache; }

export function useBrainstorm(): BrainstormRow[] {
  return useSyncExternalStore(subscribeToIdeas, getSnapshot, getSnapshot);
}
