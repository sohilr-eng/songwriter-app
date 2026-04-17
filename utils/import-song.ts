import * as FileSystem from 'expo-file-system/legacy';
import { repositories } from '@/repositories';
import { uuid } from '@/utils/uuid';
import type { ShareableSong } from '@/types/share';

const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;

export async function importSong(shareable: ShareableSong): Promise<string> {
  const songId = uuid();
  const sectionIdMap = new Map<string, string>();
  const lineIdMap = new Map<string, string>();

  for (const section of shareable.sections) {
    sectionIdMap.set(section.id, uuid());
  }

  for (const line of shareable.lines) {
    lineIdMap.set(line.id, uuid());
  }

  await repositories.songs.create({
    id: songId,
    title: shareable.song.title,
    key: shareable.song.key,
    bpm: shareable.song.bpm,
    tags: shareable.song.tags,
    coverUri: null,
    createdBy: shareable.author,
    chordDisplayMode: shareable.song.chordDisplayMode,
  });

  await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });

  for (const section of shareable.sections) {
    const newSectionId = sectionIdMap.get(section.id)!;
    const audioUri = shareable.audio?.[`section:${section.id}`]
      ? `${RECORDINGS_DIR}section-${newSectionId}.m4a`
      : null;

    if (audioUri && shareable.audio) {
      await FileSystem.writeAsStringAsync(audioUri, shareable.audio[`section:${section.id}`], {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    await repositories.songs.createSection({
      id: newSectionId,
      songId,
      label: section.label,
      sectionOrder: section.sectionOrder,
      sectionRecordingUri: audioUri,
      sectionRecordingDuration: section.sectionRecordingDuration,
    });
  }

  for (const line of shareable.lines) {
    const newLineId = lineIdMap.get(line.id)!;
    const newSectionId = sectionIdMap.get(line.sectionId)!;
    const audioUri = shareable.audio?.[`line:${line.id}`]
      ? `${RECORDINGS_DIR}line-${newLineId}.m4a`
      : null;

    if (audioUri && shareable.audio) {
      await FileSystem.writeAsStringAsync(audioUri, shareable.audio[`line:${line.id}`], {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    await repositories.songs.createLine(
      {
        id: newLineId,
        sectionId: newSectionId,
        lineOrder: line.lineOrder,
        text: line.text,
        chords: line.chords,
        memo: line.memo,
        lineRecordingUri: audioUri,
        lineRecordingDuration: line.lineRecordingDuration,
      },
      songId
    );
  }

  const existing = await repositories.customChords.list();
  const existingNames = new Set(existing.map((chord) => chord.name.toLowerCase()));

  for (const chord of shareable.customChords) {
    if (existingNames.has(chord.name.toLowerCase())) continue;

    await repositories.customChords.create({
      id: uuid(),
      name: chord.name,
      shape: chord.shape,
    });
    existingNames.add(chord.name.toLowerCase());
  }

  return songId;
}
