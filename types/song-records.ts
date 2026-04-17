import type { ChordDisplayMode, SongKey } from '@/types/song';

export interface AlbumRecord {
  id: string;
  title: string;
  artwork: string | null;
  createdAt: number;
}

export interface SongRecord {
  id: string;
  title: string;
  key: SongKey | null;
  bpm: number | null;
  tags: string | null;
  coverUri: string | null;
  createdBy: string | null;
  chordDisplayMode: ChordDisplayMode;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface SongAlbumRecord {
  songId: string;
  albumId: string;
  trackOrder: number;
}

export interface SectionRecord {
  id: string;
  songId: string;
  label: string;
  sectionOrder: number;
  sectionRecordingUri: string | null;
  sectionRecordingDuration: number | null;
}

export interface LyricLineRecord {
  id: string;
  sectionId: string;
  lineOrder: number;
  text: string;
  chords: string | null;
  memo: string | null;
  lineRecordingUri: string | null;
  lineRecordingDuration: number | null;
}

export interface SnapshotRecord {
  id: string;
  songId: string;
  label: string | null;
  createdAt: number;
  payload: string;
}

export interface BrainstormRecord {
  id: string;
  title: string;
  text: string;
  recordingUri: string | null;
  tags: string | null;
  createdAt: number;
  updatedAt: number;
}
