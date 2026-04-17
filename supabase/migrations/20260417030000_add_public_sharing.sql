create table public.public_song_links (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default gen_random_uuid()::text,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Only one active (non-revoked) link per song
create unique index public_song_links_one_active_per_song
  on public.public_song_links (song_id)
  where revoked_at is null;

create index public_song_links_owner_id_idx
  on public.public_song_links (owner_id);

alter table public.public_song_links enable row level security;

grant select, insert, update on public.public_song_links to authenticated;

create policy public_song_links_select_own
  on public.public_song_links
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy public_song_links_insert_own
  on public.public_song_links
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy public_song_links_update_own
  on public.public_song_links
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Security definer function: validates a share token and returns the song payload.
-- Runs with function-owner privileges so it can bypass RLS on the underlying tables.
-- Anon and authenticated roles can call this; write access to songs is still owner-only.
create or replace function public.get_shared_song(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_song_id uuid;
  v_result jsonb;
begin
  select song_id into v_song_id
  from public.public_song_links
  where token = p_token
    and revoked_at is null;

  if v_song_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'song_key', s.song_key,
    'bpm', s.bpm,
    'tags', s.tags,
    'chord_display_mode', s.chord_display_mode,
    'updated_at', s.updated_at,
    'owner_display_name', (
      select display_name from public.profiles where id = s.owner_id
    ),
    'sections', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', sec.id,
          'label', sec.label,
          'section_order', sec.section_order,
          'lines', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', l.id,
                'line_order', l.line_order,
                'text', l.text,
                'chords', l.chords,
                'memo', l.memo
              ) order by l.line_order
            )
            from public.song_lines l
            where l.section_id = sec.id
              and l.deleted_at is null
          ), '[]'::jsonb)
        ) order by sec.section_order
      )
      from public.song_sections sec
      where sec.song_id = s.id
        and sec.deleted_at is null
    ), '[]'::jsonb)
  ) into v_result
  from public.songs s
  where s.id = v_song_id
    and s.deleted_at is null;

  return v_result;
end;
$$;

grant execute on function public.get_shared_song(text) to anon;
grant execute on function public.get_shared_song(text) to authenticated;
