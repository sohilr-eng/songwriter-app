export type SongKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F'
  | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B'
  | 'Cm' | 'C#m' | 'Dbm' | 'Dm' | 'D#m' | 'Ebm' | 'Em' | 'Fm'
  | 'F#m' | 'Gbm' | 'Gm' | 'G#m' | 'Abm' | 'Am' | 'A#m' | 'Bbm' | 'Bm'
  | string;

// ── SQLite row types ──────────────────────────────────────────────────────

export interface AlbumRow {
  id: string;
  title: string;
  artwork: string | null;    // local file URI
  createdAt: number;
}

export interface SongRow {
  id: string;
  title: string;
  key: SongKey | null;
  bpm: number | null;
  tags: string | null;       // comma-separated
  coverUri: string | null;   // local file URI from camera roll
  createdBy: string | null;  // stub for future collaboration
  createdAt: number;
  updatedAt: number;
}

export interface SongAlbumRow {
  songId: string;
  albumId: string;
  trackOrder: number;
}

export interface SectionRow {
  id: string;
  songId: string;
  label: string;             // freeform — "Verse 1", "My Hook", etc.
  sectionOrder: number;
  sectionRecordingUri: string | null;
  sectionRecordingDuration: number | null;
}

export interface LyricLineRow {
  id: string;
  sectionId: string;
  lineOrder: number;
  text: string;
  chords: string | null;     // JSON: ChordAnnotation[]
  memo: string | null;       // text note on this line
  lineRecordingUri: string | null;
  lineRecordingDuration: number | null;
}

export interface SnapshotRow {
  id: string;
  songId: string;
  label: string | null;
  createdAt: number;
  payload: string;           // JSON of full Song
}

export interface BrainstormRow {
  id: string;
  title: string;
  text: string;
  recordingUri: string | null;
  tags: string | null;
  createdAt: number;
  updatedAt: number;
}

// ── Chord annotation ──────────────────────────────────────────────────────

export interface ChordAnnotation {
  chord: string;
  charOffset: number;        // index into the line's text string
}

// ── Enriched types used in UI ─────────────────────────────────────────────

export interface LyricLine extends LyricLineRow {
  chordAnnotations: ChordAnnotation[];
}

export interface Section extends SectionRow {
  lines: LyricLine[];
}

export interface Song extends SongRow {
  sections: Section[];
  tagsArray: string[];
}
