import { getDb } from './client';
import { emit } from './events';
import type { SnapshotRow, Song } from '@/types/song';

function rowToSnapshot(row: any): SnapshotRow {
  return {
    id:        row.id,
    songId:    row.song_id,
    label:     row.label ?? null,
    createdAt: row.created_at,
    payload:   row.payload,
  };
}

export async function getSnapshotsForSong(songId: string): Promise<SnapshotRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM snapshots WHERE song_id = ? ORDER BY created_at DESC',
    songId
  );
  return rows.map(rowToSnapshot);
}

export async function createSnapshot(
  id: string,
  songId: string,
  label: string | null,
  song: Song
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO snapshots (id, song_id, label, created_at, payload) VALUES (?, ?, ?, ?, ?)',
    id, songId, label, now, JSON.stringify(song)
  );
  emit(`snapshots:${songId}`);
}

export async function deleteSnapshot(id: string, songId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM snapshots WHERE id = ?', id);
  emit(`snapshots:${songId}`);
}

export function parseSnapshotPayload(payload: string): Song | null {
  try {
    return JSON.parse(payload) as Song;
  } catch {
    return null;
  }
}

/**
 * Replaces all sections and lines for a song with the snapshot's data.
 * Runs in a single transaction so either everything succeeds or nothing changes.
 */
export async function restoreSnapshot(snapshot: SnapshotRow, songId: string): Promise<void> {
  const song = parseSnapshotPayload(snapshot.payload);
  if (!song) throw new Error('Invalid snapshot payload');

  const db = await getDb();

  await db.withTransactionAsync(async () => {
    // Remove current sections (CASCADE deletes lines automatically)
    await db.runAsync('DELETE FROM sections WHERE song_id = ?', songId);

    // Re-insert sections and their lines from the snapshot
    for (const section of song.sections) {
      await db.runAsync(
        `INSERT INTO sections
           (id, song_id, label, section_order, section_recording_uri, section_recording_duration)
         VALUES (?, ?, ?, ?, ?, ?)`,
        section.id,
        songId,
        section.label,
        section.sectionOrder,
        section.sectionRecordingUri,
        section.sectionRecordingDuration,
      );

      for (const line of section.lines) {
        await db.runAsync(
          `INSERT INTO lyric_lines
             (id, section_id, line_order, text, chords, memo,
              line_recording_uri, line_recording_duration)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          line.id,
          line.sectionId,
          line.lineOrder,
          line.text,
          line.chords,
          line.memo,
          line.lineRecordingUri,
          line.lineRecordingDuration,
        );
      }
    }
  });

  emit(`song:${songId}`);
}
