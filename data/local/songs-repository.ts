import * as linesDb from '@/db/lines';
import * as sectionsDb from '@/db/sections';
import * as songsDb from '@/db/songs';
import type { SongsRepository } from '@/repositories/contracts';

export const localSongsRepository: SongsRepository = {
  list: songsDb.getAllSongs,
  listDeleted: songsDb.getDeletedSongs,
  getById: songsDb.getSongById,
  create: songsDb.createSong,
  update: songsDb.updateSong,
  delete: songsDb.deleteSong,
  restore: songsDb.restoreSong,
  listSections: sectionsDb.getSectionsForSong,
  createSection: sectionsDb.createSection,
  updateSection: sectionsDb.updateSection,
  deleteSection: sectionsDb.deleteSection,
  reorderSections: sectionsDb.reorderSections,
  listLines: linesDb.getLinesForSection,
  createLine: linesDb.createLine,
  updateLine: linesDb.updateLine,
  deleteLine: linesDb.deleteLine,
  reorderLines: linesDb.reorderLines,
};
