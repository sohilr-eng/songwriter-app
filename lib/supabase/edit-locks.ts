import type { SupabaseClient } from '@supabase/supabase-js';

export interface EditLock {
  songId: string;
  heldBy: string;
  heldByDisplayName: string | null;
  expiresAt: string;
  isActive: boolean;
}

interface RemoteLockRow {
  song_id: string;
  held_by: string;
  expires_at: string;
}

export async function getEditLock(
  supabase: SupabaseClient,
  songId: string
): Promise<EditLock | null> {
  const { data, error } = await supabase
    .from('song_edit_locks')
    .select('song_id, held_by, expires_at')
    .eq('song_id', songId)
    .maybeSingle<RemoteLockRow>();

  if (error) throw error;
  if (!data) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.held_by)
    .maybeSingle<{ display_name: string | null }>();

  return {
    songId: data.song_id,
    heldBy: data.held_by,
    heldByDisplayName: profile?.display_name ?? null,
    expiresAt: data.expires_at,
    isActive: new Date(data.expires_at) > new Date(),
  };
}

export async function acquireEditLock(
  supabase: SupabaseClient,
  songId: string,
  durationMinutes = 120
): Promise<boolean> {
  const { data, error } = await supabase.rpc('acquire_edit_lock', {
    p_song_id: songId,
    p_duration_minutes: durationMinutes,
  });

  if (error) throw error;
  return data as boolean;
}

export async function releaseEditLock(
  supabase: SupabaseClient,
  songId: string
): Promise<void> {
  const { error } = await supabase.rpc('release_edit_lock', { p_song_id: songId });
  if (error) throw error;
}

export async function revokeEditLock(
  supabase: SupabaseClient,
  songId: string
): Promise<void> {
  const { error } = await supabase.rpc('revoke_edit_lock', { p_song_id: songId });
  if (error) throw error;
}

export async function pushEditorChanges(
  supabase: SupabaseClient,
  songId: string,
  sections: Array<{
    id: string;
    label: string;
    lines: Array<{ id: string; text: string; memo: string | null }>;
  }>
): Promise<void> {
  for (const section of sections) {
    const { error: secError } = await supabase
      .from('song_sections')
      .update({ label: section.label })
      .eq('id', section.id);

    if (secError) throw secError;

    for (const line of section.lines) {
      const { error: lineError } = await supabase
        .from('song_lines')
        .update({ text: line.text, memo: line.memo })
        .eq('id', line.id);

      if (lineError) throw lineError;
    }
  }
}
