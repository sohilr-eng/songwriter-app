create or replace function public.bump_record_version()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = timezone('utc', now());
  new.sync_version = old.sync_version + 1;
  return new;
end;
$$;

create table public.songs (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  song_key text,
  bpm integer,
  tags text,
  cover_path text,
  chord_display_mode text not null default 'both',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  sync_version bigint not null default 0,
  constraint songs_chord_display_mode_check
    check (chord_display_mode in ('name', 'diagram', 'both'))
);

create table public.song_sections (
  id uuid primary key,
  song_id uuid not null references public.songs (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Untitled',
  section_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  sync_version bigint not null default 0
);

create table public.song_lines (
  id uuid primary key,
  song_id uuid not null references public.songs (id) on delete cascade,
  section_id uuid not null references public.song_sections (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  line_order integer not null default 0,
  text text not null default '',
  chords text,
  memo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  sync_version bigint not null default 0
);

create table public.song_audio_assets (
  id uuid primary key,
  song_id uuid not null references public.songs (id) on delete cascade,
  section_id uuid references public.song_sections (id) on delete cascade,
  line_id uuid references public.song_lines (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  duration_seconds double precision,
  content_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  sync_version bigint not null default 0,
  constraint song_audio_assets_parent_check
    check (num_nonnulls(section_id, line_id) = 1)
);

create index songs_owner_id_idx on public.songs (owner_id);
create index songs_owner_updated_at_idx on public.songs (owner_id, updated_at desc);
create index song_sections_song_id_idx on public.song_sections (song_id, section_order asc);
create index song_sections_owner_id_idx on public.song_sections (owner_id);
create index song_lines_section_id_idx on public.song_lines (section_id, line_order asc);
create index song_lines_song_id_idx on public.song_lines (song_id);
create index song_lines_owner_id_idx on public.song_lines (owner_id);
create index song_audio_assets_song_id_idx on public.song_audio_assets (song_id);
create index song_audio_assets_owner_id_idx on public.song_audio_assets (owner_id);

create trigger songs_bump_record_version
before update on public.songs
for each row
execute function public.bump_record_version();

create trigger song_sections_bump_record_version
before update on public.song_sections
for each row
execute function public.bump_record_version();

create trigger song_lines_bump_record_version
before update on public.song_lines
for each row
execute function public.bump_record_version();

create trigger song_audio_assets_bump_record_version
before update on public.song_audio_assets
for each row
execute function public.bump_record_version();

alter table public.songs enable row level security;
alter table public.song_sections enable row level security;
alter table public.song_lines enable row level security;
alter table public.song_audio_assets enable row level security;

grant select, insert, update, delete on public.songs to authenticated;
grant select, insert, update, delete on public.song_sections to authenticated;
grant select, insert, update, delete on public.song_lines to authenticated;
grant select, insert, update, delete on public.song_audio_assets to authenticated;

create policy songs_select_own
on public.songs
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy songs_insert_own
on public.songs
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy songs_update_own
on public.songs
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy songs_delete_own
on public.songs
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_sections_select_own
on public.song_sections
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_sections_insert_own
on public.song_sections
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_sections_update_own
on public.song_sections
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_sections_delete_own
on public.song_sections
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_lines_select_own
on public.song_lines
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_lines_insert_own
on public.song_lines
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_lines_update_own
on public.song_lines
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_lines_delete_own
on public.song_lines
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_audio_assets_select_own
on public.song_audio_assets
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_audio_assets_insert_own
on public.song_audio_assets
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_audio_assets_update_own
on public.song_audio_assets
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy song_audio_assets_delete_own
on public.song_audio_assets
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
