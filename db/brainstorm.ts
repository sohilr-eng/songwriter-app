import { getDb } from './client';
import { emit } from './events';
import type { BrainstormRow } from '@/types/song';

function rowToIdea(row: any): BrainstormRow {
  return {
    id:           row.id,
    title:        row.title,
    text:         row.text,
    recordingUri: row.recording_uri ?? null,
    tags:         row.tags ?? null,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

export async function getAllIdeas(): Promise<BrainstormRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM brainstorm ORDER BY updated_at DESC');
  return rows.map(rowToIdea);
}

export async function getIdeaById(id: string): Promise<BrainstormRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM brainstorm WHERE id = ?', id);
  return row ? rowToIdea(row) : null;
}

export async function createIdea(idea: BrainstormRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO brainstorm (id, title, text, recording_uri, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    idea.id, idea.title, idea.text, idea.recordingUri, idea.tags, idea.createdAt, idea.updatedAt
  );
  emit('brainstorm');
}

export async function updateIdea(id: string, patch: Partial<BrainstormRow>): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.title        !== undefined) { fields.push('title = ?');         values.push(patch.title); }
  if (patch.text         !== undefined) { fields.push('text = ?');          values.push(patch.text); }
  if (patch.recordingUri !== undefined) { fields.push('recording_uri = ?'); values.push(patch.recordingUri); }
  if (patch.tags         !== undefined) { fields.push('tags = ?');          values.push(patch.tags); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);

  await db.runAsync(`UPDATE brainstorm SET ${fields.join(', ')} WHERE id = ?`, ...values);
  emit('brainstorm');
  emit(`idea:${id}`);
}

export async function deleteIdea(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM brainstorm WHERE id = ?', id);
  emit('brainstorm');
}
