import type { SupabaseClient } from '@supabase/supabase-js';

export interface SongComment {
  id: string;
  songId: string;
  authorId: string;
  authorDisplayName: string | null;
  sectionId: string | null;
  lineId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface RemoteCommentRow {
  id: string;
  song_id: string;
  author_id: string;
  section_id: string | null;
  line_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

async function enrichWithDisplayNames(
  supabase: SupabaseClient,
  rows: RemoteCommentRow[]
): Promise<SongComment[]> {
  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)
    .returns<Array<{ id: string; display_name: string | null }>>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return rows.map((row) => ({
    id: row.id,
    songId: row.song_id,
    authorId: row.author_id,
    authorDisplayName: profileMap.get(row.author_id) ?? null,
    sectionId: row.section_id,
    lineId: row.line_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCommentsForSong(
  supabase: SupabaseClient,
  songId: string
): Promise<SongComment[]> {
  const { data, error } = await supabase
    .from('song_comments')
    .select('id, song_id, author_id, section_id, line_id, body, created_at, updated_at')
    .eq('song_id', songId)
    .order('created_at', { ascending: true })
    .returns<RemoteCommentRow[]>();

  if (error) throw error;
  return enrichWithDisplayNames(supabase, data ?? []);
}

export async function createComment(
  supabase: SupabaseClient,
  authorId: string,
  songId: string,
  body: string,
  sectionId?: string,
  lineId?: string
): Promise<SongComment> {
  const { data, error } = await supabase
    .from('song_comments')
    .insert({
      song_id: songId,
      author_id: authorId,
      body,
      section_id: sectionId ?? null,
      line_id: lineId ?? null,
    })
    .select('id, song_id, author_id, section_id, line_id, body, created_at, updated_at')
    .single<RemoteCommentRow>();

  if (error) throw error;
  const [comment] = await enrichWithDisplayNames(supabase, [data]);
  return comment;
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
): Promise<void> {
  const { error } = await supabase
    .from('song_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
