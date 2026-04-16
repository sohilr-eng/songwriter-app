import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

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
    await db.execAsync(MIGRATIONS[i]);
    await db.execAsync(`
      DELETE FROM schema_version;
      INSERT INTO schema_version (version) VALUES (${i + 1});
    `);
  }

  _db = db;
  return db;
}
