import * as FileSystem from 'expo-file-system/legacy';
import { parseChords } from './chord-parser';
import type { CustomChord } from '@/types/chord';
import type { Song } from '@/types/song';
import type { ShareableSong, SongViewData } from '@/types/share';

const SHARE_VERSION = 1;

export class ShareDecodeError extends Error {}

export function buildSharePayload(
  song: Song,
  customChords: CustomChord[],
  authorName: string | null,
  audio: Record<string, string> | null
): ShareableSong {
  return {
    version: SHARE_VERSION,
    type: 'song',
    sharedAt: Date.now(),
    author: authorName?.trim() || null,
    ownerId: null,
    song: {
      id: song.id,
      title: song.title,
      key: song.key,
      bpm: song.bpm,
      tags: song.tags,
      coverUri: song.coverUri,
      createdBy: song.createdBy,
      chordDisplayMode: song.chordDisplayMode,
    },
    sections: song.sections.map((section) => ({
      id: section.id,
      songId: song.id,
      label: section.label,
      sectionOrder: section.sectionOrder,
      sectionRecordingDuration: section.sectionRecordingDuration,
    })),
    lines: song.sections.flatMap((section) =>
      section.lines.map((line) => ({
        id: line.id,
        sectionId: section.id,
        lineOrder: line.lineOrder,
        text: line.text,
        chords: line.chords,
        memo: line.memo,
        lineRecordingDuration: line.lineRecordingDuration,
      }))
    ),
    customChords,
    audio,
  };
}

async function readAudioFile(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function readAudioForSong(
  song: Song,
  includeAudio: boolean
): Promise<Record<string, string> | null> {
  if (!includeAudio) return null;

  const audioEntries: Record<string, string> = {};

  for (const section of song.sections) {
    if (section.sectionRecordingUri) {
      audioEntries[`section:${section.id}`] = await readAudioFile(section.sectionRecordingUri);
    }

    for (const line of section.lines) {
      if (line.lineRecordingUri) {
        audioEntries[`line:${line.id}`] = await readAudioFile(line.lineRecordingUri);
      }
    }
  }

  return Object.keys(audioEntries).length > 0 ? audioEntries : null;
}

export async function writeShareFile(
  payload: ShareableSong,
  slug: string
): Promise<string> {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'song';
  const path = `${FileSystem.cacheDirectory}${safeSlug}-${Date.now()}.swsong`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
  return path;
}

export function decodeSong(json: string): ShareableSong {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ShareDecodeError('Could not read this song file.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as any).type !== 'song' ||
    (parsed as any).version !== SHARE_VERSION ||
    !Array.isArray((parsed as any).sections) ||
    !Array.isArray((parsed as any).lines) ||
    !Array.isArray((parsed as any).customChords)
  ) {
    throw new ShareDecodeError('This song file is unsupported or corrupted.');
  }

  return parsed as ShareableSong;
}

export function shareableToViewData(
  shareable: ShareableSong,
  audioUris: Record<string, string> = {}
): SongViewData {
  return {
    title: shareable.song.title,
    author: shareable.author,
    key: shareable.song.key,
    bpm: shareable.song.bpm,
    chordDisplayMode: shareable.song.chordDisplayMode,
    customChords: shareable.customChords,
    sections: shareable.sections
      .slice()
      .sort((left, right) => left.sectionOrder - right.sectionOrder)
      .map((section) => ({
        id: section.id,
        label: section.label,
        sectionOrder: section.sectionOrder,
        audioKey: shareable.audio?.[`section:${section.id}`] ? `section:${section.id}` : null,
        audioUri: audioUris[`section:${section.id}`] ?? null,
        sectionRecordingDuration: section.sectionRecordingDuration,
        lines: shareable.lines
          .filter((line) => line.sectionId === section.id)
          .sort((left, right) => left.lineOrder - right.lineOrder)
          .map((line) => ({
            id: line.id,
            text: line.text,
            memo: line.memo,
            chordAnnotations: parseChords(line.chords),
            audioKey: shareable.audio?.[`line:${line.id}`] ? `line:${line.id}` : null,
            audioUri: audioUris[`line:${line.id}`] ?? null,
            lineRecordingDuration: line.lineRecordingDuration,
          })),
      })),
  };
}

export async function writePreviewAudioFiles(
  shareable: ShareableSong
): Promise<Record<string, string>> {
  if (!shareable.audio) return {};

  const dir = `${FileSystem.cacheDirectory}shared-audio/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const uriMap: Record<string, string> = {};
  for (const [key, base64] of Object.entries(shareable.audio)) {
    const safeKey = key.replace(/[^a-z0-9:_-]/gi, '_').replace(/[:]/g, '-');
    const uri = `${dir}${safeKey}.m4a`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    uriMap[key] = uri;
  }

  return uriMap;
}
