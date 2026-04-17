import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomChord } from '@/types/chord';
import type { SharedSongData, SharedSongSection, SharedSongLine } from './public-links';

export interface MemberSongSummary {
  id: string;
  title: string;
  songKey: string | null;
  bpm: number | null;
  updatedAt: string;
  ownerDisplayName: string | null;
  role: 'viewer' | 'editor';
}

interface RemoteMemberSongRow {
  role: 'viewer' | 'editor';
  songs: {
    id: string;
    title: string;
    song_key: string | null;
    bpm: number | null;
    updated_at: string;
    owner_id: string;
  };
}

interface RemoteProfileRow {
  id: string;
  display_name: string | null;
}

export async function listMemberSongs(
  supabase: SupabaseClient
): Promise<MemberSongSummary[]> {
  const { data, error } = await supabase
    .from('song_members')
    .select('role, songs(id, title, song_key, bpm, updated_at, owner_id, deleted_at)')
    .returns<RemoteMemberSongRow[]>();

  if (error) throw error;

  const rows = (data ?? []).filter(
    (row) => row.songs && !(row.songs as unknown as { deleted_at: string | null }).deleted_at
  );

  if (rows.length === 0) return [];

  const ownerIds = [...new Set(rows.map((row) => row.songs.owner_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ownerIds)
    .returns<RemoteProfileRow[]>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return rows
    .sort((a, b) => new Date(b.songs.updated_at).getTime() - new Date(a.songs.updated_at).getTime())
    .map((row) => ({
      id: row.songs.id,
      title: row.songs.title,
      songKey: row.songs.song_key,
      bpm: row.songs.bpm,
      updatedAt: row.songs.updated_at,
      ownerDisplayName: profileMap.get(row.songs.owner_id) ?? null,
      role: row.role,
    }));
}

interface RemoteSongRow {
  id: string;
  title: string;
  song_key: string | null;
  bpm: number | null;
  tags: string | null;
  chord_display_mode: 'name' | 'diagram' | 'both';
  updated_at: string;
  owner_id: string;
}

interface RemoteProfileRow {
  display_name: string | null;
}

interface RemoteSectionRow {
  id: string;
  label: string;
  section_order: number;
}

interface RemoteLineRow {
  id: string;
  section_id: string;
  line_order: number;
  text: string;
  chords: string | null;
  memo: string | null;
}

interface RemoteCustomChordRow {
  id: string;
  name: string;
  frets: number[];
  fingers: number[] | null;
  barre: number | null;
  base_fret: number;
}

export async function fetchMemberSongGraph(
  supabase: SupabaseClient,
  songId: string
): Promise<SharedSongData | null> {
  const { data: song, error: songError } = await supabase
    .from('songs')
    .select('id, title, song_key, bpm, tags, chord_display_mode, updated_at, owner_id')
    .eq('id', songId)
    .is('deleted_at', null)
    .single<RemoteSongRow>();

  if (songError) throw songError;
  if (!song) return null;

  const [profileResult, sectionsResult, linesResult, chordsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', song.owner_id)
      .maybeSingle<RemoteProfileRow>(),
    supabase
      .from('song_sections')
      .select('id, label, section_order')
      .eq('song_id', songId)
      .is('deleted_at', null)
      .order('section_order', { ascending: true })
      .returns<RemoteSectionRow[]>(),
    supabase
      .from('song_lines')
      .select('id, section_id, line_order, text, chords, memo')
      .eq('song_id', songId)
      .is('deleted_at', null)
      .order('line_order', { ascending: true })
      .returns<RemoteLineRow[]>(),
    supabase
      .from('song_custom_chords')
      .select('id, name, frets, fingers, barre, base_fret')
      .eq('song_id', songId)
      .returns<RemoteCustomChordRow[]>(),
  ]);

  if (sectionsResult.error) throw sectionsResult.error;
  if (linesResult.error) throw linesResult.error;

  const linesBySectionId = new Map<string, SharedSongLine[]>();
  for (const line of linesResult.data ?? []) {
    const bucket = linesBySectionId.get(line.section_id) ?? [];
    bucket.push({
      id: line.id,
      lineOrder: line.line_order,
      text: line.text,
      chords: line.chords,
      memo: line.memo,
    });
    linesBySectionId.set(line.section_id, bucket);
  }

  const sections: SharedSongSection[] = (sectionsResult.data ?? []).map((sec) => ({
    id: sec.id,
    label: sec.label,
    sectionOrder: sec.section_order,
    lines: linesBySectionId.get(sec.id) ?? [],
  }));

  const customChords: CustomChord[] = (chordsResult.data ?? []).map((cc) => ({
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
  }));

  return {
    id: song.id,
    title: song.title,
    songKey: song.song_key,
    bpm: song.bpm,
    tags: song.tags,
    chordDisplayMode: song.chord_display_mode,
    updatedAt: song.updated_at,
    ownerDisplayName: profileResult.data?.display_name ?? null,
    sections,
    customChords,
  };
}
