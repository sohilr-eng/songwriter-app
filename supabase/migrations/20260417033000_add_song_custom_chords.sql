-- Table for per-song custom chord shapes synced alongside the song.
-- Local custom chords are global; only those referenced in a song's lines are upserted here.

CREATE TABLE IF NOT EXISTS public.song_custom_chords (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id    uuid        NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  frets      integer[]   NOT NULL,
  fingers    integer[],
  barre      integer,
  base_fret  integer     NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (song_id, name)
);

ALTER TABLE public.song_custom_chords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "song_custom_chords_owner_all"
  ON public.song_custom_chords
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "song_custom_chords_member_select"
  ON public.song_custom_chords
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.song_members sm
      WHERE sm.song_id = song_custom_chords.song_id
        AND sm.user_id = auth.uid()
    )
  );

-- Replace get_shared_song to include custom chords in the payload.
CREATE OR REPLACE FUNCTION public.get_shared_song(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_song_id uuid;
  v_result  jsonb;
BEGIN
  SELECT psl.song_id INTO v_song_id
  FROM public.public_song_links psl
  WHERE psl.token = p_token
    AND psl.revoked_at IS NULL;

  IF v_song_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id',               s.id,
    'title',            s.title,
    'song_key',         s.song_key,
    'bpm',              s.bpm,
    'tags',             s.tags,
    'chord_display_mode', s.chord_display_mode,
    'updated_at',       s.updated_at,
    'owner_display_name', p.display_name,
    'sections', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id',            sec.id,
            'label',         sec.label,
            'section_order', sec.section_order,
            'lines', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id',         l.id,
                    'line_order', l.line_order,
                    'text',       l.text,
                    'chords',     l.chords,
                    'memo',       l.memo
                  ) ORDER BY l.line_order
                )
                FROM public.song_lines l
                WHERE l.section_id = sec.id AND l.deleted_at IS NULL
              ),
              '[]'::jsonb
            )
          ) ORDER BY sec.section_order
        )
        FROM public.song_sections sec
        WHERE sec.song_id = s.id AND sec.deleted_at IS NULL
      ),
      '[]'::jsonb
    ),
    'custom_chords', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id',        cc.id,
            'name',      cc.name,
            'frets',     cc.frets,
            'fingers',   cc.fingers,
            'barre',     cc.barre,
            'base_fret', cc.base_fret
          )
        )
        FROM public.song_custom_chords cc
        WHERE cc.song_id = s.id
      ),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM public.songs s
  LEFT JOIN public.profiles p ON p.id = s.owner_id
  WHERE s.id = v_song_id AND s.deleted_at IS NULL;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_song(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_song(text) TO authenticated;
