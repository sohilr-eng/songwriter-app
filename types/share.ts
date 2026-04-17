import type { CustomChord } from '@/types/chord';
import type { ChordAnnotation, ChordDisplayMode } from '@/types/song';

export interface ShareSongRow {
  id: string;
  title: string;
  key: string | null;
  bpm: number | null;
  tags: string | null;
  coverUri: string | null;
  createdBy: string | null;
  chordDisplayMode: ChordDisplayMode;
}

export interface ShareSectionRow {
  id: string;
  songId: string;
  label: string;
  sectionOrder: number;
  sectionRecordingDuration: number | null;
}

export interface ShareLineRow {
  id: string;
  sectionId: string;
  lineOrder: number;
  text: string;
  chords: string | null;
  memo: string | null;
  lineRecordingDuration: number | null;
}

export interface ShareableSong {
  version: 1;
  type: 'song';
  sharedAt: number;
  author: string | null;
  ownerId: null;
  song: ShareSongRow;
  sections: ShareSectionRow[];
  lines: ShareLineRow[];
  customChords: CustomChord[];
  audio: Record<string, string> | null;
}

export interface SongViewLine {
  id: string;
  text: string;
  memo: string | null;
  chordAnnotations: ChordAnnotation[];
  audioKey: string | null;
  audioUri: string | null;
  lineRecordingDuration: number | null;
}

export interface SongViewSection {
  id: string;
  label: string;
  sectionOrder: number;
  audioKey: string | null;
  audioUri: string | null;
  sectionRecordingDuration: number | null;
  lines: SongViewLine[];
}

export interface SongViewData {
  title: string;
  author: string | null;
  key: string | null;
  bpm: number | null;
  chordDisplayMode: ChordDisplayMode;
  sections: SongViewSection[];
  customChords: CustomChord[];
}
