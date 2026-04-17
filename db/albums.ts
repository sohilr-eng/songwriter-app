import { getDb } from './client';
import { emit } from './events';
import type { AlbumRecord, SongRecord } from '@/types/song-records';

function rowToAlbum(row: any): AlbumRecord {
  return {
    id:        row.id,
    title:     row.title,
    artwork:   row.artwork ?? null,
    createdAt: row.created_at,
  };
}

export async function getAllAlbums(): Promise<AlbumRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM albums ORDER BY created_at DESC');
  return rows.map(rowToAlbum);
}

export async function getAlbumById(id: string): Promise<AlbumRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM albums WHERE id = ?', id);
  return row ? rowToAlbum(row) : null;
}

export async function createAlbum(album: AlbumRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO albums (id, title, artwork, created_at) VALUES (?, ?, ?, ?)',
    album.id, album.title, album.artwork, album.createdAt
  );
  emit('albums');
}

export async function updateAlbum(id: string, patch: Partial<Omit<AlbumRecord, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.title   !== undefined) { fields.push('title = ?');   values.push(patch.title); }
  if (patch.artwork !== undefined) { fields.push('artwork = ?'); values.push(patch.artwork); }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(`UPDATE albums SET ${fields.join(', ')} WHERE id = ?`, ...values);
  emit('albums');
  emit(`album:${id}`);
}

export async function deleteAlbum(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM albums WHERE id = ?', id);
  emit('albums');
}

export async function getSongsInAlbum(albumId: string): Promise<SongRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT s.*, sa.track_order FROM songs s
     JOIN song_albums sa ON s.id = sa.song_id
     WHERE sa.album_id = ?
     ORDER BY sa.track_order ASC`,
    albumId
  );
  return rows.map((row: any) => ({
    id:        row.id,
    title:     row.title,
    key:       row.key ?? null,
    bpm:       row.bpm ?? null,
    tags:      row.tags ?? null,
    coverUri:  row.cover_uri ?? null,
    createdBy: row.created_by ?? null,
    chordDisplayMode: row.chord_display_mode ?? 'both',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function addSongToAlbum(songId: string, albumId: string, trackOrder: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO song_albums (song_id, album_id, track_order) VALUES (?, ?, ?)',
    songId, albumId, trackOrder
  );
  emit(`album:${albumId}`);
}

export async function removeSongFromAlbum(songId: string, albumId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM song_albums WHERE song_id = ? AND album_id = ?', songId, albumId);
  emit(`album:${albumId}`);
}
