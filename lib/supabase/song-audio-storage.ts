import type { SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { ensureRecordingsDirectory } from '@/lib/audio/recordings';

export const SONG_AUDIO_BUCKET = 'song-audio';
const DEFAULT_AUDIO_CONTENT_TYPE = 'audio/mp4';

type ParentRef =
  | { sectionId: string; lineId?: never }
  | { lineId: string; sectionId?: never };

export function buildSongAudioStoragePath(
  ownerId: string,
  songId: string,
  parent: ParentRef
): string {
  if ('sectionId' in parent) {
    return `${ownerId}/${songId}/sections/${parent.sectionId}.m4a`;
  }

  return `${ownerId}/${songId}/lines/${parent.lineId}.m4a`;
}

export async function uploadSongAudioFile(
  supabase: SupabaseClient,
  localUri: string,
  storagePath: string,
  contentType = DEFAULT_AUDIO_CONTENT_TYPE
): Promise<void> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read a local recording for upload.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from(SONG_AUDIO_BUCKET).upload(storagePath, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }
}

export async function removeSongAudioFiles(
  supabase: SupabaseClient,
  storagePaths: string[]
): Promise<void> {
  if (storagePaths.length === 0) return;

  const { error } = await supabase.storage.from(SONG_AUDIO_BUCKET).remove(storagePaths);
  if (error) {
    throw error;
  }
}

export async function downloadSongAudioFile(
  supabase: SupabaseClient,
  storagePath: string,
  destinationUri: string
): Promise<void> {
  await ensureRecordingsDirectory();
  await FileSystem.deleteAsync(destinationUri, { idempotent: true }).catch(() => {});

  const { data, error } = await supabase.storage
    .from(SONG_AUDIO_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error('Could not create a secure download URL for a recording.');
  }

  await FileSystem.downloadAsync(data.signedUrl, destinationUri);
}
