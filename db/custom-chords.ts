import { getDb } from './client';
import { emit } from './events';
import type { CustomChord } from '@/types/chord';
import type { ChordShape } from '@/utils/chord-shapes';

function parseJsonArray(value: string | null): number[] | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number) : undefined;
  } catch {
    return undefined;
  }
}

function rowToCustomChord(row: any): CustomChord {
  const shape: ChordShape = {
    frets: parseJsonArray(row.frets) ?? [-1, -1, -1, -1, -1, -1],
    baseFret: row.base_fret ?? 1,
  };

  const fingers = parseJsonArray(row.fingers);
  if (fingers) shape.fingers = fingers;
  if (row.barre != null) shape.barre = row.barre;

  return {
    id: row.id,
    name: row.name,
    shape,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllCustomChords(): Promise<CustomChord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM custom_chords ORDER BY LOWER(name) ASC'
  );
  return rows.map(rowToCustomChord);
}

export async function createCustomChord(
  chord: Omit<CustomChord, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO custom_chords (id, name, frets, fingers, barre, base_fret, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    chord.id,
    chord.name,
    JSON.stringify(chord.shape.frets),
    chord.shape.fingers ? JSON.stringify(chord.shape.fingers) : null,
    chord.shape.barre ?? null,
    chord.shape.baseFret ?? 1,
    now,
    now
  );

  emit('custom_chords');
}

export async function updateCustomChord(
  id: string,
  patch: Partial<Pick<CustomChord, 'name' | 'shape'>>
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  if (patch.name !== undefined) {
    fields.push('name = ?');
    values.push(patch.name);
  }

  if (patch.shape !== undefined) {
    fields.push('frets = ?');
    values.push(JSON.stringify(patch.shape.frets));
    fields.push('fingers = ?');
    values.push(patch.shape.fingers ? JSON.stringify(patch.shape.fingers) : null);
    fields.push('barre = ?');
    values.push(patch.shape.barre ?? null);
    fields.push('base_fret = ?');
    values.push(patch.shape.baseFret ?? 1);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now, id);

  await db.runAsync(`UPDATE custom_chords SET ${fields.join(', ')} WHERE id = ?`, ...values);
  emit('custom_chords');
}

export async function deleteCustomChord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM custom_chords WHERE id = ?', id);
  emit('custom_chords');
}
