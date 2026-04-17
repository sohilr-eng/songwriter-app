-- Allow any authenticated user to read any profile (display names are visible within the app)
create policy profiles_select_any
  on public.profiles
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- song_members: who has access to a song and in what role
-- ---------------------------------------------------------------------------
create table public.song_members (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint song_members_unique_user unique (song_id, user_id),
  constraint song_members_role_check check (role in ('viewer', 'editor'))
);

create index song_members_user_id_idx on public.song_members (user_id, song_id);
create index song_members_song_id_idx on public.song_members (song_id);

alter table public.song_members enable row level security;

-- Authenticated users can read their own memberships and owners can read all
-- members of their songs.
grant select, delete on public.song_members to authenticated;
-- INSERT is handled exclusively by the redeem_song_invite security-definer function.

create policy song_members_select
  on public.song_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.songs
      where id = song_members.song_id
        and owner_id = (select auth.uid())
    )
  );

create policy song_members_delete_owner
  on public.song_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.songs
      where id = song_members.song_id
        and owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Add member read access to songs, sections, and lines
-- ---------------------------------------------------------------------------
create policy songs_select_as_member
  on public.songs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.song_members
      where song_id = songs.id
        and user_id = (select auth.uid())
    )
  );

create policy song_sections_select_as_member
  on public.song_sections
  for select
  to authenticated
  using (
    exists (
      select 1 from public.song_members
      where song_id = song_sections.song_id
        and user_id = (select auth.uid())
    )
  );

create policy song_lines_select_as_member
  on public.song_lines
  for select
  to authenticated
  using (
    exists (
      select 1 from public.song_members
      where song_id = song_lines.song_id
        and user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- song_invites: owner-generated tokens that grant access when redeemed
-- ---------------------------------------------------------------------------
create table public.song_invites (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default gen_random_uuid()::text,
  role text not null default 'viewer',
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint song_invites_role_check check (role in ('viewer', 'editor'))
);

create index song_invites_song_id_idx on public.song_invites (song_id);
create index song_invites_owner_id_idx on public.song_invites (owner_id);

alter table public.song_invites enable row level security;

grant select, insert, update on public.song_invites to authenticated;

create policy song_invites_select_own
  on public.song_invites
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy song_invites_insert_own
  on public.song_invites
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy song_invites_update_own
  on public.song_invites
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- song_comments
-- ---------------------------------------------------------------------------
create table public.song_comments (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid references public.song_sections(id) on delete cascade,
  line_id uuid references public.song_lines(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index song_comments_song_id_idx on public.song_comments (song_id, created_at desc);
create index song_comments_author_id_idx on public.song_comments (author_id);

alter table public.song_comments enable row level security;

grant select, insert, update, delete on public.song_comments to authenticated;

create policy song_comments_select
  on public.song_comments
  for select
  to authenticated
  using (
    exists (select 1 from public.songs where id = song_comments.song_id and owner_id = (select auth.uid()))
    or exists (select 1 from public.song_members where song_id = song_comments.song_id and user_id = (select auth.uid()))
  );

create policy song_comments_insert
  on public.song_comments
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      exists (select 1 from public.songs where id = song_comments.song_id and owner_id = (select auth.uid()))
      or exists (select 1 from public.song_members where song_id = song_comments.song_id and user_id = (select auth.uid()))
    )
  );

create policy song_comments_update_own
  on public.song_comments
  for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy song_comments_delete
  on public.song_comments
  for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.songs where id = song_comments.song_id and owner_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- get_invite_preview: returns invite context without requiring authentication
-- so the recipient can see who is inviting them and to which song.
-- ---------------------------------------------------------------------------
create or replace function public.get_invite_preview(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'song_title', s.title,
    'role', inv.role,
    'inviter_display_name', p.display_name,
    'is_valid',
      inv.id is not null
      and inv.redeemed_at is null
      and inv.revoked_at is null
      and (inv.expires_at is null or inv.expires_at > now())
  ) into v_result
  from public.song_invites inv
  join public.songs s on s.id = inv.song_id
  left join public.profiles p on p.id = s.owner_id
  where inv.token = p_token;

  return v_result;
end;
$$;

grant execute on function public.get_invite_preview(text) to anon;
grant execute on function public.get_invite_preview(text) to authenticated;

-- ---------------------------------------------------------------------------
-- redeem_song_invite: atomically validates token, creates member, marks invite
-- as redeemed, and returns the song_id. Auth required.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_song_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_invite_id uuid;
  v_song_id   uuid;
  v_role      text;
  v_owner_id  uuid;
  v_user_id   uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to redeem an invite';
  end if;

  select inv.id, inv.song_id, inv.role, s.owner_id
    into v_invite_id, v_song_id, v_role, v_owner_id
  from public.song_invites inv
  join public.songs s on s.id = inv.song_id
  where inv.token = p_token
    and inv.redeemed_at is null
    and inv.revoked_at is null
    and (inv.expires_at is null or inv.expires_at > now())
  for update of inv;

  if v_invite_id is null then
    return null;
  end if;

  -- Owner cannot join their own song as a member
  if v_owner_id = v_user_id then
    raise exception 'You are already the owner of this song';
  end if;

  insert into public.song_members (song_id, user_id, role, granted_by)
  values (v_song_id, v_user_id, v_role, v_owner_id)
  on conflict (song_id, user_id) do update set role = excluded.role, updated_at = now();

  update public.song_invites
  set redeemed_by = v_user_id, redeemed_at = now()
  where id = v_invite_id;

  return v_song_id;
end;
$$;

grant execute on function public.redeem_song_invite(text) to authenticated;
