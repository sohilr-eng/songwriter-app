create index song_audio_assets_section_id_idx
  on public.song_audio_assets (section_id)
  where section_id is not null;

create index song_audio_assets_line_id_idx
  on public.song_audio_assets (line_id)
  where line_id is not null;
