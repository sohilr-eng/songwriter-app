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
  INSERT INTO schema_version (version) VALUES (1);
  `,
];
