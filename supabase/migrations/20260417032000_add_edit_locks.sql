-- ---------------------------------------------------------------------------
-- song_edit_locks: coarse per-song write lock for editors
-- ---------------------------------------------------------------------------
create table public.song_edit_locks (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null unique references public.songs(id) on delete cascade,
  held_by uuid not null references auth.users(id) on delete cascade,
  granted_by_owner boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index song_edit_locks_held_by_idx on public.song_edit_locks (held_by);

alter table public.song_edit_locks enable row level security;

-- Only read; mutations happen through security-definer functions.
grant select on public.song_edit_locks to authenticated;

-- Owners and members can see the lock state for a song.
create policy song_edit_locks_select
  on public.song_edit_locks
  for select
  to authenticated
  using (
    exists (select 1 from public.songs where id = song_edit_locks.song_id and owner_id = (select auth.uid()))
    or exists (select 1 from public.song_members where song_id = song_edit_locks.song_id and user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Editor write policies on songs / sections / lines
-- An editor may write only while they hold an active lock on the song.
-- ---------------------------------------------------------------------------
create policy songs_update_as_editor_with_lock
  on public.songs
  for update
  to authenticated
  using (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = songs.id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = songs.id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  )
  with check (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = songs.id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = songs.id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  );

create policy song_sections_update_as_editor_with_lock
  on public.song_sections
  for update
  to authenticated
  using (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = song_sections.song_id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = song_sections.song_id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  )
  with check (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = song_sections.song_id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = song_sections.song_id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  );

create policy song_lines_update_as_editor_with_lock
  on public.song_lines
  for update
  to authenticated
  using (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = song_lines.song_id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = song_lines.song_id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  )
  with check (
    exists (
      select 1 from public.song_members sm
      where sm.song_id = song_lines.song_id and sm.user_id = (select auth.uid()) and sm.role = 'editor'
    )
    and exists (
      select 1 from public.song_edit_locks sel
      where sel.song_id = song_lines.song_id and sel.held_by = (select auth.uid()) and sel.expires_at > now()
    )
  );

-- ---------------------------------------------------------------------------
-- acquire_edit_lock: editor grabs the write lock for a song.
-- Succeeds if: no lock exists, the existing lock is expired, or the caller
-- already holds it (extends the expiry). Fails if another editor holds an
-- active lock. Returns true on success.
-- ---------------------------------------------------------------------------
create or replace function public.acquire_edit_lock(
  p_song_id uuid,
  p_duration_minutes int default 120
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id         uuid;
  v_existing_holder uuid;
  v_existing_expiry timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.song_members
    where song_id = p_song_id and user_id = v_user_id and role = 'editor'
  ) then
    raise exception 'Editor role required to acquire an edit lock';
  end if;

  select held_by, expires_at
    into v_existing_holder, v_existing_expiry
  from public.song_edit_locks
  where song_id = p_song_id;

  if v_existing_holder is not null then
    if v_existing_holder = v_user_id then
      -- Extend our own lock.
      update public.song_edit_locks
         set expires_at = now() + (p_duration_minutes || ' minutes')::interval,
             updated_at = now()
       where song_id = p_song_id;
      return true;
    elsif v_existing_expiry > now() then
      -- Another editor holds an active lock.
      return false;
    else
      -- Expired lock: take it over.
      update public.song_edit_locks
         set held_by = v_user_id,
             expires_at = now() + (p_duration_minutes || ' minutes')::interval,
             updated_at = now()
       where song_id = p_song_id;
      return true;
    end if;
  else
    insert into public.song_edit_locks (song_id, held_by, expires_at)
    values (p_song_id, v_user_id, now() + (p_duration_minutes || ' minutes')::interval);
    return true;
  end if;
end;
$$;

grant execute on function public.acquire_edit_lock(uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- release_edit_lock: editor voluntarily releases the lock they hold.
-- ---------------------------------------------------------------------------
create or replace function public.release_edit_lock(p_song_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.song_edit_locks
   where song_id = p_song_id and held_by = auth.uid();
end;
$$;

grant execute on function public.release_edit_lock(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- revoke_edit_lock: owner forcibly removes any lock on their song.
-- ---------------------------------------------------------------------------
create or replace function public.revoke_edit_lock(p_song_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not exists (
    select 1 from public.songs where id = p_song_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the song owner can revoke an edit lock';
  end if;

  delete from public.song_edit_locks where song_id = p_song_id;
end;
$$;

grant execute on function public.revoke_edit_lock(uuid) to authenticated;
