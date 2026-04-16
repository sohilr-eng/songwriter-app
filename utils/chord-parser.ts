import type { ChordAnnotation } from '@/types/song';

export function parseChords(json: string | null): ChordAnnotation[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function serializeChords(annotations: ChordAnnotation[]): string {
  return JSON.stringify(annotations);
}
