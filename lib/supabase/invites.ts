import type { SupabaseClient } from '@supabase/supabase-js';

export interface SongInvite {
  id: string;
  songId: string;
  token: string;
  role: 'viewer' | 'editor';
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface InvitePreview {
  songTitle: string;
  role: 'viewer' | 'editor';
  inviterDisplayName: string | null;
  isValid: boolean;
}

interface RemoteInviteRow {
  id: string;
  song_id: string;
  token: string;
  role: 'viewer' | 'editor';
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function rowToInvite(row: RemoteInviteRow): SongInvite {
  return {
    id: row.id,
    songId: row.song_id,
    token: row.token,
    role: row.role,
    redeemedBy: row.redeemed_by,
    redeemedAt: row.redeemed_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function getInvitesForSong(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<SongInvite[]> {
  const { data, error } = await supabase
    .from('song_invites')
    .select('id, song_id, token, role, redeemed_by, redeemed_at, expires_at, revoked_at, created_at')
    .eq('song_id', songId)
    .eq('owner_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .returns<RemoteInviteRow[]>();

  if (error) throw error;
  return (data ?? []).map(rowToInvite);
}

export async function createInvite(
  supabase: SupabaseClient,
  userId: string,
  songId: string,
  role: 'viewer' | 'editor' = 'viewer'
): Promise<SongInvite> {
  const { data, error } = await supabase
    .from('song_invites')
    .insert({ song_id: songId, owner_id: userId, role })
    .select('id, song_id, token, role, redeemed_by, redeemed_at, expires_at, revoked_at, created_at')
    .single<RemoteInviteRow>();

  if (error) throw error;
  return rowToInvite(data);
}

export async function revokeInvite(
  supabase: SupabaseClient,
  userId: string,
  inviteId: string
): Promise<void> {
  const { error } = await supabase
    .from('song_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .eq('owner_id', userId);

  if (error) throw error;
}

interface RawInvitePreview {
  song_title: string;
  role: 'viewer' | 'editor';
  inviter_display_name: string | null;
  is_valid: boolean;
}

export async function getInvitePreview(
  supabase: SupabaseClient,
  token: string
): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc('get_invite_preview', { p_token: token });

  if (error) throw error;
  if (!data) return null;

  const raw = data as RawInvitePreview;
  return {
    songTitle: raw.song_title,
    role: raw.role,
    inviterDisplayName: raw.inviter_display_name,
    isValid: raw.is_valid,
  };
}

export async function redeemInvite(
  supabase: SupabaseClient,
  token: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('redeem_song_invite', { p_token: token });

  if (error) throw error;
  return data as string | null;
}
