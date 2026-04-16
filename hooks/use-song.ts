import { useEffect, useState } from 'react';
import { getSongById } from '@/db/songs';
import { getSectionsForSong } from '@/db/sections';
import { getLinesForSection } from '@/db/lines';
import { subscribe } from '@/db/events';
import { parseChords } from '@/utils/chord-parser';
import { parseTags } from '@/utils/format';
import type { Song, Section, LyricLine } from '@/types/song';

export function useSong(id: string): Song | null {
  const [song, setSong] = useState<Song | null>(null);

  async function load() {
    const songRow = await getSongById(id);
    if (!songRow) { setSong(null); return; }

    const sectionRows = await getSectionsForSong(id);
    const sections: Section[] = await Promise.all(
      sectionRows.map(async (s) => {
        const lineRows = await getLinesForSection(s.id);
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
