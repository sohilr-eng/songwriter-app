import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomChord } from '@/types/chord';

export interface PublicSongLink {
  id: string;
  songId: string;
  token: string;
  createdAt: string;
  revokedAt: string | null;
}

interface RemotePublicLinkRow {
  id: string;
  song_id: string;
  token: string;
  created_at: string;
  revoked_at: string | null;
}

export interface SharedSongLine {
  id: string;
  lineOrder: number;
  text: string;
  chords: string | null;
  memo: string | null;
}

export interface SharedSongSection {
  id: string;
  label: string;
  sectionOrder: number;
  lines: SharedSongLine[];
}

export interface SharedSongData {
  id: string;
  title: string;
  songKey: string | null;
  bpm: number | null;
  tags: string | null;
  chordDisplayMode: 'name' | 'diagram' | 'both';
  updatedAt: string;
  ownerDisplayName: string | null;
  sections: SharedSongSection[];
  customChords: CustomChord[];
}

function rowToLink(row: RemotePublicLinkRow): PublicSongLink {
  return {
    id: row.id,
    songId: row.song_id,
    token: row.token,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function getActiveLinkForSong(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<PublicSongLink | null> {
  const { data, error } = await supabase
    .from('public_song_links')
    .select('id, song_id, token, created_at, revoked_at')
    .eq('song_id', songId)
    .eq('owner_id', userId)
    .is('revoked_at', null)
    .maybeSingle<RemotePublicLinkRow>();

  if (error) throw error;
  return data ? rowToLink(data) : null;
}

export async function createPublicLink(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<PublicSongLink> {
  const { data, error } = await supabase
    .from('public_song_links')
    .insert({ song_id: songId, owner_id: userId })
    .select('id, song_id, token, created_at, revoked_at')
    .single<RemotePublicLinkRow>();

  if (error) throw error;
  return rowToLink(data);
}

export async function revokePublicLink(
  supabase: SupabaseClient,
  userId: string,
  linkId: string
): Promise<void> {
  const { error } = await supabase
    .from('public_song_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', linkId)
    .eq('owner_id', userId);

  if (error) throw error;
}

interface RawSharedSongSection {
  id: string;
  label: string;
  section_order: number;
  lines: Array<{
    id: string;
    line_order: number;
    text: string;
    chords: string | null;
    memo: string | null;
  }>;
}

interface RawCustomChord {
  id: string;
  name: string;
  frets: number[];
  fingers: number[] | null;
  barre: number | null;
  base_fret: number;
}

interface RawSharedSongData {
  id: string;
  title: string;
  song_key: string | null;
  bpm: number | null;
  tags: string | null;
  chord_display_mode: 'name' | 'diagram' | 'both';
  updated_at: string;
  owner_display_name: string | null;
  sections: RawSharedSongSection[];
  custom_chords: RawCustomChord[];
}

export async function fetchSharedSong(
  supabase: SupabaseClient,
  token: string
): Promise<SharedSongData | null> {
  const { data, error } = await supabase.rpc('get_shared_song', { p_token: token });

  if (error) throw error;
  if (!data) return null;

  const raw = data as RawSharedSongData;
  return {
    id: raw.id,
    title: raw.title,
    songKey: raw.song_key,
    bpm: raw.bpm,
    tags: raw.tags,
    chordDisplayMode: raw.chord_display_mode,
    updatedAt: raw.updated_at,
    ownerDisplayName: raw.owner_display_name,
    sections: (raw.sections ?? []).map((sec) => ({
      id: sec.id,
      label: sec.label,
      sectionOrder: sec.section_order,
      lines: (sec.lines ?? []).map((line) => ({
        id: line.id,
        lineOrder: line.line_order,
        text: line.text,
        chords: line.chords,
        memo: line.memo,
      })),
    })),
    customChords: (raw.custom_chords ?? []).map((cc) => ({
      id: cc.id,
      name: cc.name,
      shape: {
        frets: cc.frets,
        ...(cc.fingers ? { fingers: cc.fingers } : {}),
        ...(cc.barre != null ? { barre: cc.barre } : {}),
        baseFret: cc.base_fret,
      },
      createdAt: 0,
      updatedAt: 0,
    })),
  };
}
