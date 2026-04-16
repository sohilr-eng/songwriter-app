import { getDb } from './client';
import { emit } from './events';
import type { SectionRow } from '@/types/song';

function rowToSection(row: any): SectionRow {
  return {
    id:                      row.id,
    songId:                  row.song_id,
    label:                   row.label,
    sectionOrder:            row.section_order,
    sectionRecordingUri:     row.section_recording_uri ?? null,
    sectionRecordingDuration: row.section_recording_duration ?? null,
  };
}

export async function getSectionsForSong(songId: string): Promise<SectionRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sections WHERE song_id = ? ORDER BY section_order ASC',
    songId
  );
  return rows.map(rowToSection);
}

export async function createSection(section: SectionRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sections (id, song_id, label, section_order, section_recording_uri, section_recording_duration)
     VALUES (?, ?, ?, ?, ?, ?)`,
    section.id, section.songId, section.label, section.sectionOrder,
    section.sectionRecordingUri, section.sectionRecordingDuration
  );
  emit(`song:${section.songId}`);
}

export async function updateSection(id: string, songId: string, patch: Partial<SectionRow>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.label                   !== undefined) { fields.push('label = ?');                      values.push(patch.label); }
  if (patch.sectionRecordingUri     !== undefined) { fields.push('section_recording_uri = ?');      values.push(patch.sectionRecordingUri); }
  if (patch.sectionRecordingDuration !== undefined){ fields.push('section_recording_duration = ?'); values.push(patch.sectionRecordingDuration); }

  if (fields.length === 0) return;
  values.push(id);

  await db.runAsync(`UPDATE sections SET ${fields.join(', ')} WHERE id = ?`, ...values);
  emit(`song:${songId}`);
}

export async function deleteSection(id: string, songId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sections WHERE id = ?', id);
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
    }
  });
  emit(`song:${songId}`);
}
