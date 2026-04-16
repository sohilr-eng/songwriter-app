import { getDb } from './client';
import { emit } from './events';
import type { SongRow } from '@/types/song';

function rowToSong(row: any): SongRow {
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
  };
}

export async function getAllSongs(): Promise<SongRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM songs ORDER BY updated_at DESC'
  );
  return rows.map(rowToSong);
}

export async function getSongById(id: string): Promise<SongRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM songs WHERE id = ?', id);
  return row ? rowToSong(row) : null;
}

export async function createSong(song: Omit<SongRow, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO songs (id, title, key, bpm, tags, cover_uri, created_by, chord_display_mode, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    song.id, song.title, song.key, song.bpm, song.tags, song.coverUri, song.createdBy, song.chordDisplayMode, now, now
  );
  emit('songs');
}

export async function updateSong(id: string, patch: Partial<Omit<SongRow, 'id' | 'createdAt'>>): Promise<void> {
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
  emit('songs');
  emit(`song:${id}`);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM songs WHERE id = ?', id);
  emit('songs');
}
