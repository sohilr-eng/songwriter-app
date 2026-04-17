alter table public.profiles
  add column if not exists genre_tags text,
  add column if not exists instruments text,
  add column if not exists website_url text,
  add column if not exists instagram_handle text,
  add column if not exists spotify_url text,
  add column if not exists soundcloud_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatar_objects_select_public'
  ) then
    create policy "avatar_objects_select_public"
    on storage.objects
    for select
    to public
    using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatar_objects_insert_own'
  ) then
    create policy "avatar_objects_insert_own"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatar_objects_update_own'
  ) then
    create policy "avatar_objects_update_own"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatar_objects_delete_own'
  ) then
    create policy "avatar_objects_delete_own"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;
end
$$;
