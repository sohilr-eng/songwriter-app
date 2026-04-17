import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import { parseChords } from '@/utils/chord-parser';
import { parseTags } from '@/utils/format';
import type { Song, Section, LyricLine } from '@/types/song';

export function useSong(id: string): Song | null {
  const [song, setSong] = useState<Song | null>(null);

  async function load() {
    const songRow = await repositories.songs.getById(id);
    if (!songRow) { setSong(null); return; }

    const sectionRows = await repositories.songs.listSections(id);
    const sections: Section[] = await Promise.all(
      sectionRows.map(async (s) => {
        const lineRows = await repositories.songs.listLines(s.id);
        const lines: LyricLine[] = lineRows.map(l => ({
          ...l,
          chordAnnotations: parseChords(l.chords),
        }));
        return { ...s, lines };
      })
    );

    setSong({ ...songRow, sections, tagsArray: parseTags(songRow.tags) });
  }

  useEffect(() => {
    load();
    const unsub = subscribe(`song:${id}`, load);
    return unsub;
  }, [id]);

  return song;
}
