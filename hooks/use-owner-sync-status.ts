import { useSyncExternalStore } from 'react';
import {
  getOwnerSyncStatus,
  subscribeOwnerSyncStatus,
} from '@/lib/sync/owner-sync-status';

export function useOwnerSyncStatus() {
  return useSyncExternalStore(
    subscribeOwnerSyncStatus,
    getOwnerSyncStatus,
    getOwnerSyncStatus
  );
}
