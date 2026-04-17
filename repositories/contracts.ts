import type { CustomChord } from '@/types/chord';
import type {
  LyricLineRow,
  SectionRow,
  Album,
  BrainstormIdea,
  Snapshot,
  Song,
  SongSummary,
} from '@/types/song';

export type SongPatch = Partial<Omit<SongSummary, 'id' | 'createdAt'>>;
export type AlbumPatch = Partial<Omit<Album, 'id' | 'createdAt'>>;
export type BrainstormPatch = Partial<BrainstormIdea>;
export type CustomChordPatch = Partial<Pick<CustomChord, 'name' | 'shape'>>;

export interface SongsRepository {
  list(): Promise<SongSummary[]>;
  listDeleted(): Promise<SongSummary[]>;
  getById(id: string): Promise<SongSummary | null>;
  create(song: Omit<SongSummary, 'createdAt' | 'updatedAt'>): Promise<void>;
  update(id: string, patch: SongPatch): Promise<void>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  listSections(songId: string): Promise<SectionRow[]>;
  createSection(section: SectionRow): Promise<void>;
  updateSection(id: string, songId: string, patch: Partial<SectionRow>): Promise<void>;
  deleteSection(id: string, songId: string): Promise<void>;
  reorderSections(songId: string, ordered: Array<{ id: string; order: number }>): Promise<void>;
  listLines(sectionId: string): Promise<LyricLineRow[]>;
  createLine(line: LyricLineRow, songId: string): Promise<void>;
  updateLine(id: string, songId: string, patch: Partial<LyricLineRow>): Promise<void>;
  deleteLine(id: string, songId: string): Promise<void>;
  reorderLines(sectionId: string, songId: string, ordered: Array<{ id: string; order: number }>): Promise<void>;
}

export interface AlbumsRepository {
  list(): Promise<Album[]>;
  getById(id: string): Promise<Album | null>;
  create(album: Album): Promise<void>;
  update(id: string, patch: AlbumPatch): Promise<void>;
  delete(id: string): Promise<void>;
  listSongs(albumId: string): Promise<SongSummary[]>;
  addSong(songId: string, albumId: string, trackOrder: number): Promise<void>;
  removeSong(songId: string, albumId: string): Promise<void>;
}

export interface BrainstormRepository {
  list(): Promise<BrainstormIdea[]>;
  getById(id: string): Promise<BrainstormIdea | null>;
  create(idea: BrainstormIdea): Promise<void>;
  update(id: string, patch: BrainstormPatch): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CustomChordsRepository {
  list(): Promise<CustomChord[]>;
  create(chord: Omit<CustomChord, 'createdAt' | 'updatedAt'>): Promise<void>;
  update(id: string, patch: CustomChordPatch): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface SnapshotsRepository {
  listForSong(songId: string): Promise<Snapshot[]>;
  create(id: string, songId: string, label: string | null, song: Song): Promise<void>;
  delete(id: string, songId: string): Promise<void>;
  restore(snapshot: Snapshot, songId: string): Promise<void>;
}
