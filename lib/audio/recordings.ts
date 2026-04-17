import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_DIR_NAME = 'recordings/';

function getRecordingsDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Local file storage is unavailable on this device.');
  }

  return `${FileSystem.documentDirectory}${RECORDINGS_DIR_NAME}`;
}

export function getSectionRecordingStorageKey(sectionId: string): string {
  return `section-${sectionId}`;
}

export function getLineRecordingStorageKey(lineId: string): string {
  return `line-${lineId}`;
}

export function getRecordingFilePath(storageKey: string, extension = 'm4a'): string {
  return `${getRecordingsDirectory()}${storageKey}.${extension}`;
}

export function getSectionRecordingFilePath(sectionId: string, extension = 'm4a'): string {
  return getRecordingFilePath(getSectionRecordingStorageKey(sectionId), extension);
}

export function getLineRecordingFilePath(lineId: string, extension = 'm4a'): string {
  return getRecordingFilePath(getLineRecordingStorageKey(lineId), extension);
}

export async function ensureRecordingsDirectory(): Promise<void> {
  await FileSystem.makeDirectoryAsync(getRecordingsDirectory(), { intermediates: true });
}
