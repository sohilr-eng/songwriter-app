import type * as SQLite from 'expo-sqlite';
import { emit } from '@/app-events';
import { getDb } from './client';
import type { LocalSyncState, LocalSyncStateUpsert, SyncEntityType, SyncStatus } from '@/types/sync';

function rowToSyncState(row: any): LocalSyncState {
  return {
    entityType: row.entity_type,
    entityId: row.entity_id,
    remoteId: row.remote_id ?? null,
    ownerId: row.owner_id ?? null,
    updatedBy: row.updated_by ?? null,
    syncStatus: row.sync_status,
    localUpdatedAt: row.local_updated_at,
    remoteUpdatedAt: row.remote_updated_at ?? null,
    lastSyncedAt: row.last_synced_at ?? null,
    syncVersion: row.sync_version ?? 0,
    deletedAt: row.deleted_at ?? null,
    lastError: row.last_error ?? null,
  };
}

async function resolveDb(db?: SQLite.SQLiteDatabase): Promise<SQLite.SQLiteDatabase> {
  return db ?? getDb();
}

export async function getSyncState(
  entityType: SyncEntityType,
  entityId: string,
  db?: SQLite.SQLiteDatabase
): Promise<LocalSyncState | null> {
  const client = await resolveDb(db);
  const row = await client.getFirstAsync<any>(
    `SELECT *
     FROM sync_state
     WHERE entity_type = ? AND entity_id = ?`,
    entityType,
    entityId
  );

  return row ? rowToSyncState(row) : null;
}

export async function listSongSyncStates(
  statuses?: SyncStatus[],
  db?: SQLite.SQLiteDatabase
): Promise<LocalSyncState[]> {
  const client = await resolveDb(db);

  if (!statuses || statuses.length === 0) {
    const rows = await client.getAllAsync<any>(
      `SELECT *
       FROM sync_state
       WHERE entity_type = 'song'
       ORDER BY local_updated_at DESC`
    );
    return rows.map(rowToSyncState);
  }

  const placeholders = statuses.map(() => '?').join(', ');
  const rows = await client.getAllAsync<any>(
    `SELECT *
     FROM sync_state
     WHERE entity_type = 'song'
       AND sync_status IN (${placeholders})
     ORDER BY local_updated_at DESC`,
    ...statuses
  );

  return rows.map(rowToSyncState);
}

export async function upsertSyncState(
  input: LocalSyncStateUpsert,
  db?: SQLite.SQLiteDatabase
): Promise<void> {
  const client = await resolveDb(db);
  const existing = await getSyncState(input.entityType, input.entityId, client);
  const now = input.localUpdatedAt ?? Date.now();

  if (!existing) {
    await client.runAsync(
      `INSERT INTO sync_state (
        entity_type,
        entity_id,
        remote_id,
        owner_id,
        updated_by,
        sync_status,
        local_updated_at,
        remote_updated_at,
        last_synced_at,
        sync_version,
        deleted_at,
        last_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.entityType,
      input.entityId,
      input.remoteId ?? null,
      input.ownerId ?? null,
      input.updatedBy ?? null,
      input.syncStatus ?? 'local_only',
      now,
      input.remoteUpdatedAt ?? null,
      input.lastSyncedAt ?? null,
      input.syncVersion ?? 0,
      input.deletedAt ?? null,
      input.lastError ?? null
    );
    emit('sync_state');
    return;
  }

  await client.runAsync(
    `UPDATE sync_state
     SET remote_id = ?,
         owner_id = ?,
         updated_by = ?,
         sync_status = ?,
         local_updated_at = ?,
         remote_updated_at = ?,
         last_synced_at = ?,
         sync_version = ?,
         deleted_at = ?,
         last_error = ?
     WHERE entity_type = ? AND entity_id = ?`,
    input.remoteId ?? existing.remoteId,
    input.ownerId ?? existing.ownerId,
    input.updatedBy ?? existing.updatedBy,
    input.syncStatus ?? existing.syncStatus,
    now,
    input.remoteUpdatedAt ?? existing.remoteUpdatedAt,
    input.lastSyncedAt ?? existing.lastSyncedAt,
    input.syncVersion ?? existing.syncVersion,
    input.deletedAt ?? existing.deletedAt,
    input.lastError ?? existing.lastError,
    input.entityType,
    input.entityId
  );
  emit('sync_state');
}

export async function deleteSyncState(
  entityType: SyncEntityType,
  entityId: string,
  db?: SQLite.SQLiteDatabase
): Promise<void> {
  const client = await resolveDb(db);
  await client.runAsync(
    `DELETE FROM sync_state
     WHERE entity_type = ? AND entity_id = ?`,
    entityType,
    entityId
  );
  emit('sync_state');
}

function nextTouchedStatus(current: SyncStatus): SyncStatus {
  switch (current) {
    case 'synced':
      return 'pending_push';
    case 'pending_push':
    case 'conflict':
    case 'local_only':
    default:
      return current;
  }
}

export async function touchSyncState(
  entityType: SyncEntityType,
  entityId: string,
  db?: SQLite.SQLiteDatabase
): Promise<void> {
  const client = await resolveDb(db);
  const existing = await getSyncState(entityType, entityId, client);

  await upsertSyncState(
    {
      entityType,
      entityId,
      syncStatus: existing ? nextTouchedStatus(existing.syncStatus) : 'local_only',
      localUpdatedAt: Date.now(),
      lastError: existing?.syncStatus === 'conflict' ? existing.lastError : null,
    },
    client
  );
}
