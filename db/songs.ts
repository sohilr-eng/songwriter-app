import { getDb } from './client';
import { emit } from './events';
import { getSyncState, touchSyncState, upsertSyncState } from './sync-state';
import type { SongRecord } from '@/types/song-records';

function rowToSong(row: any): SongRecord {
  return {
    id:         row.id,
    title:      row.title,
    key:        row.key ?? null,
    bpm:        row.bpm ?? null,
    tags:       row.tags ?? null,
    coverUri:   row.cover_uri ?? null,
    createdBy:  row.created_by ?? null,
    chordDisplayMode: row.chord_display_mode ?? 'both',
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
    deletedAt:  row.deleted_at ?? null,
  };
}

export async function getAllSongs(): Promise<SongRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM songs WHERE deleted_at IS NULL ORDER BY updated_at DESC'
  );
  return rows.map(rowToSong);
}

export async function getDeletedSongs(): Promise<SongRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM songs WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );
  return rows.map(rowToSong);
}

export async function getSongById(id: string): Promise<SongRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM songs WHERE id = ? AND deleted_at IS NULL',
    id
  );
  return row ? rowToSong(row) : null;
}

export async function getSongByIdIncludingDeleted(id: string): Promise<SongRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM songs WHERE id = ?', id);
  return row ? rowToSong(row) : null;
}

export async function createSong(song: Omit<SongRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO songs (id, title, key, bpm, tags, cover_uri, created_by, chord_display_mode, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    song.id, song.title, song.key, song.bpm, song.tags, song.coverUri, song.createdBy, song.chordDisplayMode, now, now, null
  );
  await touchSyncState('song', song.id, db);
  emit('songs');
}

export async function updateSong(id: string, patch: Partial<Omit<SongRecord, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.title     !== undefined) { fields.push('title = ?');      values.push(patch.title); }
  if (patch.key       !== undefined) { fields.push('key = ?');        values.push(patch.key); }
  if (patch.bpm       !== undefined) { fields.push('bpm = ?');        values.push(patch.bpm); }
  if (patch.tags      !== undefined) { fields.push('tags = ?');        values.push(patch.tags); }
  if (patch.coverUri  !== undefined) { fields.push('cover_uri = ?');  values.push(patch.coverUri); }
  if (patch.chordDisplayMode !== undefined) { fields.push('chord_display_mode = ?'); values.push(patch.chordDisplayMode); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);

  await db.runAsync(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`, ...values);
  await touchSyncState('song', id, db);
  emit('songs');
  emit(`song:${id}`);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const existingSync = await getSyncState('song', id, db);

  await db.runAsync(
    'UPDATE songs SET deleted_at = ?, updated_at = ? WHERE id = ?',
    now,
    now,
    id
  );
  await upsertSyncState(
    {
      entityType: 'song',
      entityId: id,
      syncStatus: existingSync?.syncStatus === 'synced' ? 'pending_push' : existingSync?.syncStatus ?? 'local_only',
      localUpdatedAt: now,
      deletedAt: now,
      lastError: null,
    },
    db
  );
  emit('songs');
  emit(`song:${id}`);
}

export async function restoreSong(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const existingSync = await getSyncState('song', id, db);

  await db.runAsync(
    'UPDATE songs SET deleted_at = NULL, updated_at = ? WHERE id = ?',
    now,
    id
  );
  await upsertSyncState(
    {
      entityType: 'song',
      entityId: id,
      remoteId: existingSync?.remoteId ?? null,
      ownerId: existingSync?.ownerId ?? null,
      updatedBy: existingSync?.updatedBy ?? null,
      syncStatus: existingSync?.remoteId ? 'pending_push' : existingSync?.syncStatus ?? 'local_only',
      localUpdatedAt: now,
      deletedAt: null,
      lastError: null,
    },
    db
  );
  emit('songs');
  emit(`song:${id}`);
}
