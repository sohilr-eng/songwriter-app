import { useSyncExternalStore } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { BrainstormIdea } from '@/types/song';

let cache: BrainstormIdea[] = [];
let loaded = false;

function subscribeToIdeas(cb: () => void) {
  const unsub = subscribe('brainstorm', () => {
    repositories.brainstorm.list().then(rows => { cache = rows; cb(); });
  });
  if (!loaded) {
    repositories.brainstorm.list().then(rows => { cache = rows; loaded = true; });
  }
  return unsub;
}

function getSnapshot() { return cache; }

export function useBrainstorm(): BrainstormIdea[] {
  return useSyncExternalStore(subscribeToIdeas, getSnapshot, getSnapshot);
}
