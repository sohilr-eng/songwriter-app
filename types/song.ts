import type {
  AlbumRecord,
  BrainstormRecord,
  LyricLineRecord,
  SectionRecord,
  SnapshotRecord,
  SongAlbumRecord,
  SongRecord,
} from '@/types/song-records';

export type SongKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F'
  | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B'
  | 'Cm' | 'C#m' | 'Dbm' | 'Dm' | 'D#m' | 'Ebm' | 'Em' | 'Fm'
  | 'F#m' | 'Gbm' | 'Gm' | 'G#m' | 'Abm' | 'Am' | 'A#m' | 'Bbm' | 'Bm'
  | string;

export type ChordDisplayMode = 'name' | 'diagram' | 'both';

export interface Album extends AlbumRecord {}

export interface SongSummary extends SongRecord {}

export interface Snapshot extends SnapshotRecord {}

export interface BrainstormIdea extends BrainstormRecord {}

export interface ChordAnnotation {
  chord: string;
  charOffset: number;
}

export interface LyricLine extends LyricLineRecord {
  chordAnnotations: ChordAnnotation[];
}

export interface Section extends SectionRecord {
  lines: LyricLine[];
}

export interface Song extends SongSummary {
  sections: Section[];
  tagsArray: string[];
}

// Temporary compatibility aliases during the phase 1 alpha refactor.
export type AlbumRow = Album;
export type SongRow = SongSummary;
export type SongAlbumRow = SongAlbumRecord;
export type SectionRow = SectionRecord;
export type LyricLineRow = LyricLineRecord;
export type SnapshotRow = Snapshot;
export type BrainstormRow = BrainstormIdea;
