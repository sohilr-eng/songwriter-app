import type { SupabaseClient } from '@supabase/supabase-js';

export interface SongMember {
  id: string;
  songId: string;
  userId: string;
  role: 'viewer' | 'editor';
  displayName: string | null;
  createdAt: string;
}

interface RemoteMemberRow {
  id: string;
  song_id: string;
  user_id: string;
  role: 'viewer' | 'editor';
  created_at: string;
}

export async function getMembersForSong(
  supabase: SupabaseClient,
  songId: string
): Promise<SongMember[]> {
  const { data, error } = await supabase
    .from('song_members')
    .select('id, song_id, user_id, role, created_at')
    .eq('song_id', songId)
    .order('created_at', { ascending: true })
    .returns<RemoteMemberRow[]>();

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = data.map((row) => row.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)
    .returns<Array<{ id: string; display_name: string | null }>>();

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return data.map((row) => ({
    id: row.id,
    songId: row.song_id,
    userId: row.user_id,
    role: row.role,
    displayName: profileMap.get(row.user_id) ?? null,
    createdAt: row.created_at,
  }));
}

export async function removeMember(
  supabase: SupabaseClient,
  memberId: string
): Promise<void> {
  const { error } = await supabase
    .from('song_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
