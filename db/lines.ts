import { getDb } from './client';
import { emit } from './events';
import { deleteSyncState, touchSyncState } from './sync-state';
import type { LyricLineRecord } from '@/types/song-records';

function rowToLine(row: any): LyricLineRecord {
  return {
    id:                    row.id,
    sectionId:             row.section_id,
    lineOrder:             row.line_order,
    text:                  row.text,
    chords:                row.chords ?? null,
    memo:                  row.memo ?? null,
    lineRecordingUri:      row.line_recording_uri ?? null,
    lineRecordingDuration: row.line_recording_duration ?? null,
  };
}

export async function getLinesForSection(sectionId: string): Promise<LyricLineRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM lyric_lines WHERE section_id = ? ORDER BY line_order ASC',
    sectionId
  );
  return rows.map(rowToLine);
}

export async function createLine(line: LyricLineRecord, songId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO lyric_lines (id, section_id, line_order, text, chords, memo, line_recording_uri, line_recording_duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    line.id, line.sectionId, line.lineOrder, line.text,
    line.chords, line.memo, line.lineRecordingUri, line.lineRecordingDuration
  );
  await touchSyncState('line', line.id, db);
  await touchSyncState('song', songId, db);
  emit(`song:${songId}`);
}

export async function updateLine(
  id: string,
  songId: string,
  patch: Partial<LyricLineRecord>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.text                  !== undefined) { fields.push('text = ?');                   values.push(patch.text); }
  if (patch.chords                !== undefined) { fields.push('chords = ?');                 values.push(patch.chords); }
  if (patch.memo                  !== undefined) { fields.push('memo = ?');                   values.push(patch.memo); }
  if (patch.lineRecordingUri      !== undefined) { fields.push('line_recording_uri = ?');     values.push(patch.lineRecordingUri); }
  if (patch.lineRecordingDuration !== undefined) { fields.push('line_recording_duration = ?'); values.push(patch.lineRecordingDuration); }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(`UPDATE lyric_lines SET ${fields.join(', ')} WHERE id = ?`, ...values);
  await touchSyncState('line', id, db);
  await touchSyncState('song', songId, db);
  emit(`song:${songId}`);
}

export async function deleteLine(id: string, songId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM lyric_lines WHERE id = ?', id);
  await deleteSyncState('line', id, db);
  await touchSyncState('song', songId, db);
  emit(`song:${songId}`);
}

export async function reorderLines(
  sectionId: string,
  songId: string,
  ordered: Array<{ id: string; order: number }>
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const { id, order } of ordered) {
      await db.runAsync('UPDATE lyric_lines SET line_order = ? WHERE id = ?', order, id);
      await touchSyncState('line', id, db);
    }
    await touchSyncState('song', songId, db);
  });
  emit(`song:${songId}`);
}
