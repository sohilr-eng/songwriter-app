import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

async function columnExists(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  return rows.some((row) => row.name === columnName);
}

async function runMigration(db: SQLite.SQLiteDatabase, index: number): Promise<void> {
  switch (index) {
    case 1: {
      if (!(await columnExists(db, 'songs', 'chord_display_mode'))) {
        await db.execAsync(MIGRATIONS[index]);
      }
      return;
    }
    case 5: {
      if (!(await columnExists(db, 'songs', 'deleted_at'))) {
        await db.execAsync('ALTER TABLE songs ADD COLUMN deleted_at INTEGER;');
      }
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_songs_deleted_at ON songs(deleted_at);');
      return;
    }
    default:
      await db.execAsync(MIGRATIONS[index]);
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync('songwriter.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run migrations
  let version = 0;
  try {
    const row = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version LIMIT 1'
    );
    version = row?.version ?? 0;
  } catch {
    // schema_version table doesn't exist yet — run from v0
    version = 0;
  }

  for (let i = version; i < MIGRATIONS.length; i++) {
    await runMigration(db, i);
    await db.execAsync(`
      DELETE FROM schema_version;
      INSERT INTO schema_version (version) VALUES (${i + 1});
    `);
  }

  _db = db;
  return db;
}
