export type OwnerSyncPhase = 'idle' | 'scheduled' | 'syncing';

export interface OwnerSyncStatus {
  phase: OwnerSyncPhase;
  pendingCount: number;
  lastAttemptAt: number | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastResult:
    | {
        attempted: number;
        synced: number;
        failedCount: number;
      }
    | null;
}

const defaultStatus: OwnerSyncStatus = {
  phase: 'idle',
  pendingCount: 0,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastResult: null,
};

let currentStatus: OwnerSyncStatus = defaultStatus;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getOwnerSyncStatus(): OwnerSyncStatus {
  return currentStatus;
}

export function subscribeOwnerSyncStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateOwnerSyncStatus(
  patch: Partial<OwnerSyncStatus> | ((current: OwnerSyncStatus) => OwnerSyncStatus)
): void {
  currentStatus =
    typeof patch === 'function'
      ? patch(currentStatus)
      : {
          ...currentStatus,
          ...patch,
        };
  notify();
}

export function resetOwnerSyncStatus(): void {
  currentStatus = defaultStatus;
  notify();
}
