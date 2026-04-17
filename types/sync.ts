export type SyncEntityType = 'song' | 'section' | 'line';

export type SyncStatus = 'local_only' | 'pending_push' | 'synced' | 'conflict';

export interface LocalSyncState {
  entityType: SyncEntityType;
  entityId: string;
  remoteId: string | null;
  ownerId: string | null;
  updatedBy: string | null;
  syncStatus: SyncStatus;
  localUpdatedAt: number;
  remoteUpdatedAt: number | null;
  lastSyncedAt: number | null;
  syncVersion: number;
  deletedAt: number | null;
  lastError: string | null;
}

export interface LocalSyncStateUpsert {
  entityType: SyncEntityType;
  entityId: string;
  remoteId?: string | null;
  ownerId?: string | null;
  updatedBy?: string | null;
  syncStatus?: SyncStatus;
  localUpdatedAt?: number;
  remoteUpdatedAt?: number | null;
  lastSyncedAt?: number | null;
  syncVersion?: number;
  deletedAt?: number | null;
  lastError?: string | null;
}
