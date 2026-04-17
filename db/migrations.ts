export const MIGRATIONS = [
  // v1 — initial schema
  `
  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artwork TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    key TEXT,
    bpm INTEGER,
    tags TEXT,
    cover_uri TEXT,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS song_albums (
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    track_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(song_id, album_id)
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Untitled',
    section_order INTEGER NOT NULL DEFAULT 0,
    section_recording_uri TEXT,
    section_recording_duration REAL
  );

  CREATE TABLE IF NOT EXISTS lyric_lines (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    line_order INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL DEFAULT '',
    chords TEXT,
    memo TEXT,
    line_recording_uri TEXT,
    line_recording_duration REAL
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    label TEXT,
    created_at INTEGER NOT NULL,
    payload TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS brainstorm (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Idea',
    text TEXT NOT NULL DEFAULT '',
    recording_uri TEXT,
    tags TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sections_song     ON sections(song_id);
  CREATE INDEX IF NOT EXISTS idx_lines_section     ON lyric_lines(section_id);
  CREATE INDEX IF NOT EXISTS idx_song_albums_album ON song_albums(album_id);
  CREATE INDEX IF NOT EXISTS idx_snapshots_song    ON snapshots(song_id);

  CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
  INSERT INTO schema_version (version)
  SELECT 0
  WHERE NOT EXISTS (SELECT 1 FROM schema_version);
  `,
  `
  ALTER TABLE songs ADD COLUMN chord_display_mode TEXT NOT NULL DEFAULT 'both';
  `,
  `
  CREATE TABLE IF NOT EXISTS custom_chords (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    frets TEXT NOT NULL,
    fingers TEXT,
    barre INTEGER,
    base_fret INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_chords_name ON custom_chords(name);
  `,
  `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS sync_state (
    entity_type TEXT NOT NULL CHECK (entity_type IN ('song', 'section', 'line')),
    entity_id TEXT NOT NULL,
    remote_id TEXT,
    owner_id TEXT,
    updated_by TEXT,
    sync_status TEXT NOT NULL DEFAULT 'local_only'
      CHECK (sync_status IN ('local_only', 'pending_push', 'synced', 'conflict')),
    local_updated_at INTEGER NOT NULL DEFAULT 0,
    remote_updated_at INTEGER,
    last_synced_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER,
    last_error TEXT,
    PRIMARY KEY (entity_type, entity_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sync_state_status ON sync_state(sync_status);
  CREATE INDEX IF NOT EXISTS idx_sync_state_owner ON sync_state(owner_id);
  `,
  `
  ALTER TABLE songs ADD COLUMN deleted_at INTEGER;
  CREATE INDEX IF NOT EXISTS idx_songs_deleted_at ON songs(deleted_at);
  `,
];
