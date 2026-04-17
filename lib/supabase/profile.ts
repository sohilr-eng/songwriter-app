import * as FileSystem from 'expo-file-system';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/auth';

export interface ProfileUpdateInput {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarPath?: string | null;
  genreTags?: string[];
  instruments?: string[];
  websiteUrl?: string | null;
  instagramHandle?: string | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
}

const PROFILE_COLUMNS =
  'id, username, display_name, bio, avatar_path, genre_tags, instruments, website_url, instagram_handle, spotify_url, soundcloud_url';

function isMissingProfilesTable(code: string | null | undefined, message: string | undefined): boolean {
  if (code === 'PGRST205' || code === '42P01') return true;
  return message?.toLowerCase().includes('profiles') ?? false;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rowToProfile(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    username: (data.username as string | null) ?? null,
    displayName: (data.display_name as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    avatarPath: (data.avatar_path as string | null) ?? null,
    genreTags: parseJsonArray(data.genre_tags as string | null),
    instruments: parseJsonArray(data.instruments as string | null),
    websiteUrl: (data.website_url as string | null) ?? null,
    instagramHandle: (data.instagram_handle as string | null) ?? null,
    spotifyUrl: (data.spotify_url as string | null) ?? null,
    soundcloudUrl: (data.soundcloud_url as string | null) ?? null,
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingProfilesTable(error.code, error.message)) return null;
    throw error;
  }

  if (!data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

export async function saveProfile(
  supabase: SupabaseClient,
  input: ProfileUpdateInput
): Promise<Profile | null> {
  const upsertData: Record<string, unknown> = {
    id: input.userId,
    username: normalizeOptionalText(input.username),
    display_name: normalizeOptionalText(input.displayName),
    bio: normalizeOptionalText(input.bio),
  };

  if (input.avatarPath !== undefined) upsertData.avatar_path = input.avatarPath;
  if (input.genreTags !== undefined) upsertData.genre_tags = JSON.stringify(input.genreTags);
  if (input.instruments !== undefined) upsertData.instruments = JSON.stringify(input.instruments);
  if (input.websiteUrl !== undefined) upsertData.website_url = normalizeOptionalText(input.websiteUrl);
  if (input.instagramHandle !== undefined) upsertData.instagram_handle = normalizeOptionalText(input.instagramHandle);
  if (input.spotifyUrl !== undefined) upsertData.spotify_url = normalizeOptionalText(input.spotifyUrl);
  if (input.soundcloudUrl !== undefined) upsertData.soundcloud_url = normalizeOptionalText(input.soundcloudUrl);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(upsertData, { onConflict: 'id' })
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    if (isMissingProfilesTable(error.code, error.message)) return null;
    throw error;
  }

  if (!data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  localUri: string
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const storagePath = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, byteArray, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;
  return storagePath;
}

export function getAvatarUrl(supabase: SupabaseClient, avatarPath: string): string {
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data.publicUrl;
}
