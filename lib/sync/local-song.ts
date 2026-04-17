import * as linesDb from '@/db/lines';
import * as sectionsDb from '@/db/sections';
import * as songsDb from '@/db/songs';
import type { LyricLineRecord, SectionRecord, SongRecord } from '@/types/song-records';

export interface LocalSongGraph {
  song: SongRecord;
  sections: SectionRecord[];
  lines: LyricLineRecord[];
}

export async function loadLocalSongGraph(songId: string): Promise<LocalSongGraph | null> {
  const song = await songsDb.getSongByIdIncludingDeleted(songId);
  if (!song) return null;

  const sections = await sectionsDb.getSectionsForSong(songId);
  const lineGroups = await Promise.all(
    sections.map(async (section) => linesDb.getLinesForSection(section.id))
  );

  return {
    song,
    sections,
    lines: lineGroups.flat(),
  };
}
