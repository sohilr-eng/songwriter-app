import { getDb } from './client';
import { emit } from './events';
import { deleteSyncState, touchSyncState } from './sync-state';
import type { SectionRecord } from '@/types/song-records';

function rowToSection(row: any): SectionRecord {
  return {
    id:                      row.id,
    songId:                  row.song_id,
    label:                   row.label,
    sectionOrder:            row.section_order,
    sectionRecordingUri:     row.section_recording_uri ?? null,
    sectionRecordingDuration: row.section_recording_duration ?? null,
  };
}

export async function getSectionsForSong(songId: string): Promise<SectionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sections WHERE song_id = ? ORDER BY section_order ASC',
    songId
  );
  return rows.map(rowToSection);
}

export async function createSection(section: SectionRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sections (id, song_id, label, section_order, section_recording_uri, section_recording_duration)
     VALUES (?, ?, ?, ?, ?, ?)`,
    section.id, section.songId, section.label, section.sectionOrder,
    section.sectionRecordingUri, section.sectionRecordingDuration
  );
  await touchSyncState('section', section.id, db);
  await touchSyncState('song', section.songId, db);
  emit(`song:${section.songId}`);
}

export async function updateSection(id: string, songId: string, patch: Partial<SectionRecord>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.label                   !== undefined) { fields.push('label = ?');                      values.push(patch.label); }
  if (patch.sectionRecordingUri     !== undefined) { fields.push('section_recording_uri = ?');      values.push(patch.sectionRecordingUri); }
  if (patch.sectionRecordingDuration !== undefined){ fields.push('section_recording_duration = ?'); values.push(patch.sectionRecordingDuration); }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(`UPDATE sections SET ${fields.join(', ')} WHERE id = ?`, ...values);
  await touchSyncState('section', id, db);
  await touchSyncState('song', songId, db);
  emit(`song:${songId}`);
}

export async function deleteSection(id: string, songId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sections WHERE id = ?', id);
  await deleteSyncState('section', id, db);
  await touchSyncState('song', songId, db);
  emit(`song:${songId}`);
}

export async function reorderSections(
  songId: string,
  ordered: Array<{ id: string; order: number }>
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const { id, order } of ordered) {
      await db.runAsync('UPDATE sections SET section_order = ? WHERE id = ?', order, id);
      await touchSyncState('section', id, db);
    }
    await touchSyncState('song', songId, db);
  });
  emit(`song:${songId}`);
}
