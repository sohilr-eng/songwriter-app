insert into storage.buckets (id, name, public)
values ('song-audio', 'song-audio', false)
on conflict (id) do nothing;

create policy "song_audio_objects_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "song_audio_objects_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "song_audio_objects_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "song_audio_objects_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
