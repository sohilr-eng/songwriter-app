import type { SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { emit } from '@/app-events';
import { getDb } from '@/db/client';
import { getAllCustomChords } from '@/db/custom-chords';
import { deleteSyncState, getSyncState, upsertSyncState } from '@/db/sync-state';
import {
  getLineRecordingFilePath,
  getLineRecordingStorageKey,
  getSectionRecordingFilePath,
  getSectionRecordingStorageKey,
} from '@/lib/audio/recordings';
import { loadLocalSongGraph } from '@/lib/sync/local-song';
import {
  buildSongAudioStoragePath,
  downloadSongAudioFile,
  removeSongAudioFiles,
  uploadSongAudioFile,
} from '@/lib/supabase/song-audio-storage';
import { parseChords } from '@/utils/chord-parser';

function toMillis(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

interface RemoteSongRow {
  id: string;
  owner_id: string;
  title: string;
  song_key: string | null;
  bpm: number | null;
  tags: string | null;
  cover_path: string | null;
  chord_display_mode: 'name' | 'diagram' | 'both';
  created_at: string;
  updated_at: string;
  sync_version: number;
}

interface RemoteSectionRow {
  id: string;
  song_id: string;
  owner_id: string;
  label: string;
  section_order: number;
  created_at: string;
  updated_at: string;
  sync_version: number;
}

interface RemoteLineRow {
  id: string;
  song_id: string;
  section_id: string;
  owner_id: string;
  line_order: number;
  text: string;
  chords: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  sync_version: number;
}

interface RemoteAudioAssetRow {
  id: string;
  song_id: string;
  owner_id: string;
  section_id: string | null;
  line_id: string | null;
  storage_path: string;
  duration_seconds: number | null;
  content_type: string | null;
  created_at: string;
  updated_at: string;
  sync_version: number;
}

interface LocalSongAudioAsset {
  id: string;
  songId: string;
  ownerId: string;
  sectionId: string | null;
  lineId: string | null;
  localUri: string;
  storagePath: string;
  durationSeconds: number | null;
  contentType: string;
}

interface RestoredAudioAsset {
  localUri: string;
  durationSeconds: number | null;
}

function getAudioAssetKey(sectionId: string | null, lineId: string | null): string {
  if (sectionId) return `section:${sectionId}`;
  if (lineId) return `line:${lineId}`;
  throw new Error('Audio asset is missing its parent identifier.');
}

async function deleteMissingChildren(
  supabase: SupabaseClient,
  table: 'song_sections' | 'song_lines',
  songId: string,
  ownerId: string,
  localIds: string[]
) {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('song_id', songId)
    .eq('owner_id', ownerId);

  if (error) throw error;

  const remoteIds = (data ?? []).map((row) => row.id as string);
  const missingIds = remoteIds.filter((id) => !localIds.includes(id));
  if (missingIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('song_id', songId)
    .eq('owner_id', ownerId)
    .in('id', missingIds);

  if (deleteError) throw deleteError;
}

async function listRemoteAudioAssets(
  supabase: SupabaseClient,
  songId: string,
  ownerId: string
): Promise<RemoteAudioAssetRow[]> {
  const { data, error } = await supabase
    .from('song_audio_assets')
    .select(
      'id, song_id, owner_id, section_id, line_id, storage_path, duration_seconds, content_type, created_at, updated_at, sync_version'
    )
    .eq('song_id', songId)
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .returns<RemoteAudioAssetRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function collectLocalSongAudioAssets(
  ownerId: string,
  songId: string,
  local: Awaited<ReturnType<typeof loadLocalSongGraph>>
): Promise<LocalSongAudioAsset[]> {
  if (!local) return [];

  const assets: LocalSongAudioAsset[] = [];

  for (const section of local.sections) {
    if (!section.sectionRecordingUri) continue;

    const info = await FileSystem.getInfoAsync(section.sectionRecordingUri);
    if (!info.exists) continue;

    assets.push({
      id: section.id,
      songId,
      ownerId,
      sectionId: section.id,
      lineId: null,
      localUri: section.sectionRecordingUri,
      storagePath: buildSongAudioStoragePath(ownerId, songId, { sectionId: section.id }),
      durationSeconds: section.sectionRecordingDuration,
      contentType: 'audio/mp4',
    });
  }

  for (const line of local.lines) {
    if (!line.lineRecordingUri) continue;

    const info = await FileSystem.getInfoAsync(line.lineRecordingUri);
    if (!info.exists) continue;

    assets.push({
      id: line.id,
      songId,
      ownerId,
      sectionId: null,
      lineId: line.id,
      localUri: line.lineRecordingUri,
      storagePath: buildSongAudioStoragePath(ownerId, songId, { lineId: line.id }),
      durationSeconds: line.lineRecordingDuration,
      contentType: 'audio/mp4',
    });
  }

  return assets;
}

async function syncSongAudioAssets(
  supabase: SupabaseClient,
  ownerId: string,
  songId: string,
  local: NonNullable<Awaited<ReturnType<typeof loadLocalSongGraph>>>
): Promise<void> {
  const remoteAudioAssets = await listRemoteAudioAssets(supabase, songId, ownerId);
  const localAudioAssets = await collectLocalSongAudioAssets(ownerId, songId, local);
  const localAudioKeys = new Set(
    localAudioAssets.map((asset) => getAudioAssetKey(asset.sectionId, asset.lineId))
  );

  const remoteAssetsToDelete = remoteAudioAssets.filter(
    (asset) => !localAudioKeys.has(getAudioAssetKey(asset.section_id, asset.line_id))
  );

  if (remoteAssetsToDelete.length > 0) {
    await removeSongAudioFiles(
      supabase,
      remoteAssetsToDelete.map((asset) => asset.storage_path)
    );

    const { error } = await supabase
      .from('song_audio_assets')
      .delete()
      .eq('song_id', songId)
      .eq('owner_id', ownerId)
      .in(
        'id',
        remoteAssetsToDelete.map((asset) => asset.id)
      );

    if (error) throw error;
  }

  for (const asset of localAudioAssets) {
    await uploadSongAudioFile(supabase, asset.localUri, asset.storagePath, asset.contentType);
  }

  if (localAudioAssets.length === 0) return;

  const { error } = await supabase.from('song_audio_assets').upsert(
    localAudioAssets.map((asset) => ({
      id: asset.id,
      song_id: asset.songId,
      section_id: asset.sectionId,
      line_id: asset.lineId,
      owner_id: asset.ownerId,
      storage_path: asset.storagePath,
      duration_seconds: asset.durationSeconds,
      content_type: asset.contentType,
      deleted_at: null,
    })),
    { onConflict: 'id' }
  );

  if (error) throw error;
}

async function hydrateRemoteAudioAssets(
  supabase: SupabaseClient,
  remoteAudioAssets: RemoteAudioAssetRow[]
): Promise<{
  sectionAudio: Map<string, RestoredAudioAsset>;
  lineAudio: Map<string, RestoredAudioAsset>;
}> {
  const sectionAudio = new Map<string, RestoredAudioAsset>();
  const lineAudio = new Map<string, RestoredAudioAsset>();

  for (const asset of remoteAudioAssets) {
    if (asset.section_id) {
      const localUri = getSectionRecordingFilePath(asset.section_id);
      await downloadSongAudioFile(supabase, asset.storage_path, localUri);
      sectionAudio.set(asset.section_id, {
        localUri,
        durationSeconds: asset.duration_seconds,
      });
      continue;
    }

    if (asset.line_id) {
      const localUri = getLineRecordingFilePath(asset.line_id);
      await downloadSongAudioFile(supabase, asset.storage_path, localUri);
      lineAudio.set(asset.line_id, {
        localUri,
        durationSeconds: asset.duration_seconds,
      });
    }
  }

  return { sectionAudio, lineAudio };
}

async function cleanupRemovedLocalRecordings(
  currentSectionRows: Array<{ id: string; section_recording_uri: string | null }>,
  currentLineRows: Array<{ id: string; line_recording_uri: string | null }>,
  sectionAudio: Map<string, RestoredAudioAsset>,
  lineAudio: Map<string, RestoredAudioAsset>
): Promise<void> {
  for (const row of currentSectionRows) {
    if (!row.section_recording_uri) continue;
    if (sectionAudio.has(row.id)) continue;
    await FileSystem.deleteAsync(row.section_recording_uri, { idempotent: true }).catch(() => {});
  }

  for (const row of currentLineRows) {
    if (!row.line_recording_uri) continue;
    if (lineAudio.has(row.id)) continue;
    await FileSystem.deleteAsync(row.line_recording_uri, { idempotent: true }).catch(() => {});
  }
}

async function syncCustomChords(
  supabase: SupabaseClient,
  userId: string,
  songId: string,
  lineChordStrings: Array<string | null>
): Promise<void> {
  const usedNames = new Set<string>();
  for (const chordStr of lineChordStrings) {
    for (const ann of parseChords(chordStr)) {
      usedNames.add(ann.chord.toLowerCase());
    }
  }

  const allLocalChords = await getAllCustomChords();
  const chordsToSync = allLocalChords.filter((c) => usedNames.has(c.name.toLowerCase()));

  const { data: remoteRows } = await supabase
    .from('song_custom_chords')
    .select('id, name')
    .eq('song_id', songId)
    .eq('owner_id', userId);

  const localNameSet = new Set(chordsToSync.map((c) => c.name.toLowerCase()));
  const toDelete = (remoteRows ?? []).filter(
    (r) => !localNameSet.has((r.name as string).toLowerCase())
  );

  if (toDelete.length > 0) {
    await supabase
      .from('song_custom_chords')
      .delete()
      .eq('song_id', songId)
      .eq('owner_id', userId)
      .in('id', toDelete.map((r) => r.id));
  }

  if (chordsToSync.length === 0) return;

  const { error } = await supabase.from('song_custom_chords').upsert(
    chordsToSync.map((chord) => ({
      song_id: songId,
      owner_id: userId,
      name: chord.name,
      frets: chord.shape.frets,
      fingers: chord.shape.fingers ?? null,
      barre: chord.shape.barre ?? null,
      base_fret: chord.shape.baseFret ?? 1,
    })),
    { onConflict: 'song_id,name' }
  );
  if (error) throw error;
}

export async function pushSongToCloud(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<void> {
  const local = await loadLocalSongGraph(songId);
  if (!local) {
    throw new Error('Song not found locally.');
  }

  const db = await getDb();
  const startedAt = Date.now();
  const currentSongSync = await getSyncState('song', local.song.id, db);

  await db.withTransactionAsync(async () => {
    await upsertSyncState(
      {
        entityType: 'song',
        entityId: local.song.id,
        remoteId: currentSongSync?.remoteId ?? null,
        ownerId: userId,
        updatedBy: userId,
        syncStatus: 'pending_push',
        localUpdatedAt: startedAt,
        deletedAt: local.song.deletedAt ?? null,
        lastError: null,
      },
      db
    );
  });

  try {
    if (local.song.deletedAt && !currentSongSync?.remoteId) {
      await upsertSyncState(
        {
          entityType: 'song',
          entityId: local.song.id,
          ownerId: userId,
          updatedBy: userId,
          syncStatus: 'synced',
          localUpdatedAt: startedAt,
          lastSyncedAt: startedAt,
          deletedAt: local.song.deletedAt,
          lastError: null,
        },
        db
      );
      emit('songs');
      emit(`song:${songId}`);
      return;
    }

    const { data: songRows, error: songError } = await supabase
      .from('songs')
      .upsert(
        {
          id: local.song.id,
          owner_id: userId,
          title: local.song.title,
          song_key: local.song.key,
          bpm: local.song.bpm,
          tags: local.song.tags,
          cover_path: null,
          chord_display_mode: local.song.chordDisplayMode,
          deleted_at: local.song.deletedAt ? new Date(local.song.deletedAt).toISOString() : null,
        },
        { onConflict: 'id' }
      )
      .select('id, updated_at, sync_version')
      .single();

    if (songError) throw songError;

    if (local.song.deletedAt) {
      const completedAt = Date.now();
      await upsertSyncState(
        {
          entityType: 'song',
          entityId: local.song.id,
          remoteId: local.song.id,
          ownerId: userId,
          updatedBy: userId,
          syncStatus: 'synced',
          localUpdatedAt: completedAt,
          remoteUpdatedAt: toMillis(songRows.updated_at) ?? completedAt,
          lastSyncedAt: completedAt,
          syncVersion: Number(songRows.sync_version ?? 0),
          deletedAt: local.song.deletedAt,
          lastError: null,
        },
        db
      );
      emit('songs');
      emit(`song:${songId}`);
      return;
    }

    await deleteMissingChildren(
      supabase,
      'song_lines',
      local.song.id,
      userId,
      local.lines.map((line) => line.id)
    );
    await deleteMissingChildren(
      supabase,
      'song_sections',
      local.song.id,
      userId,
      local.sections.map((section) => section.id)
    );

    const sectionRows =
      local.sections.length > 0
        ? (
            await supabase
              .from('song_sections')
              .upsert(
                local.sections.map((section) => ({
                  id: section.id,
                  song_id: local.song.id,
                  owner_id: userId,
                  label: section.label,
                  section_order: section.sectionOrder,
                  deleted_at: null,
                })),
                { onConflict: 'id' }
              )
              .select('id, updated_at, sync_version')
          )
        : { data: [], error: null };

    if (sectionRows.error) throw sectionRows.error;

    const lineRows =
      local.lines.length > 0
        ? (
            await supabase
              .from('song_lines')
              .upsert(
                local.lines.map((line) => ({
                  id: line.id,
                  song_id: local.song.id,
                  section_id: line.sectionId,
                  owner_id: userId,
                  line_order: line.lineOrder,
                  text: line.text,
                  chords: line.chords,
                  memo: line.memo,
                  deleted_at: null,
                })),
                { onConflict: 'id' }
              )
              .select('id, updated_at, sync_version')
          )
        : { data: [], error: null };

    if (lineRows.error) throw lineRows.error;

    await syncCustomChords(supabase, userId, local.song.id, local.lines.map((l) => l.chords));
    await syncSongAudioAssets(supabase, userId, local.song.id, local);

    const sectionMap = new Map((sectionRows.data ?? []).map((row) => [row.id as string, row]));
    const lineMap = new Map((lineRows.data ?? []).map((row) => [row.id as string, row]));
    const completedAt = Date.now();

    await db.withTransactionAsync(async () => {
      await upsertSyncState(
        {
          entityType: 'song',
          entityId: local.song.id,
          remoteId: local.song.id,
          ownerId: userId,
          updatedBy: userId,
          syncStatus: 'synced',
          localUpdatedAt: completedAt,
          remoteUpdatedAt: toMillis(songRows.updated_at) ?? completedAt,
          lastSyncedAt: completedAt,
          syncVersion: Number(songRows.sync_version ?? 0),
          deletedAt: null,
          lastError: null,
        },
        db
      );

      for (const section of local.sections) {
        const remote = sectionMap.get(section.id);
        await upsertSyncState(
          {
            entityType: 'section',
            entityId: section.id,
            remoteId: section.id,
            ownerId: userId,
            updatedBy: userId,
            syncStatus: 'synced',
            localUpdatedAt: completedAt,
            remoteUpdatedAt: toMillis(remote?.updated_at as string | undefined) ?? completedAt,
            lastSyncedAt: completedAt,
            syncVersion: Number(remote?.sync_version ?? 0),
            deletedAt: null,
            lastError: null,
          },
          db
        );
      }

      for (const line of local.lines) {
        const remote = lineMap.get(line.id);
        await upsertSyncState(
          {
            entityType: 'line',
            entityId: line.id,
            remoteId: line.id,
            ownerId: userId,
            updatedBy: userId,
            syncStatus: 'synced',
            localUpdatedAt: completedAt,
            remoteUpdatedAt: toMillis(remote?.updated_at as string | undefined) ?? completedAt,
            lastSyncedAt: completedAt,
            syncVersion: Number(remote?.sync_version ?? 0),
            deletedAt: null,
            lastError: null,
          },
          db
        );
      }
    });

    emit(`song:${songId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloud sync failed.';
    await upsertSyncState({
      entityType: 'song',
      entityId: local.song.id,
      ownerId: userId,
      updatedBy: userId,
      syncStatus: 'conflict',
      localUpdatedAt: Date.now(),
      lastError: message,
    });
    emit(`song:${songId}`);
    throw error;
  }
}

export async function restoreSongFromCloud(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<void> {
  const { data: remoteSong, error: songError } = await supabase
    .from('songs')
    .select(
      'id, owner_id, title, song_key, bpm, tags, cover_path, chord_display_mode, created_at, updated_at, sync_version'
    )
    .eq('id', songId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .single<RemoteSongRow>();

  if (songError) throw songError;

  const { data: remoteSections, error: sectionsError } = await supabase
    .from('song_sections')
    .select('id, song_id, owner_id, label, section_order, created_at, updated_at, sync_version')
    .eq('song_id', songId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('section_order', { ascending: true })
    .returns<RemoteSectionRow[]>();

  if (sectionsError) throw sectionsError;

  const { data: remoteLines, error: linesError } = await supabase
    .from('song_lines')
    .select('id, song_id, section_id, owner_id, line_order, text, chords, memo, created_at, updated_at, sync_version')
    .eq('song_id', songId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('line_order', { ascending: true })
    .returns<RemoteLineRow[]>();

  if (linesError) throw linesError;

  const remoteAudioAssets = await listRemoteAudioAssets(supabase, songId, userId);
  const hydratedAudio = await hydrateRemoteAudioAssets(supabase, remoteAudioAssets);

  const db = await getDb();
  const now = Date.now();
  const localSongRow = await db.getFirstAsync<{
    cover_uri: string | null;
    created_by: string | null;
  }>('SELECT cover_uri, created_by FROM songs WHERE id = ?', songId);
  const currentSectionRows = await db.getAllAsync<{
    id: string;
    section_recording_uri: string | null;
  }>('SELECT id, section_recording_uri FROM sections WHERE song_id = ?', songId);
  const currentLineRows = await db.getAllAsync<{
    id: string;
    line_recording_uri: string | null;
  }>(
    `SELECT lyric_lines.id, lyric_lines.line_recording_uri
     FROM lyric_lines
     INNER JOIN sections ON sections.id = lyric_lines.section_id
     WHERE sections.song_id = ?`,
    songId
  );

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO songs (
        id,
        title,
        key,
        bpm,
        tags,
        cover_uri,
        created_by,
        chord_display_mode,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        key = excluded.key,
        bpm = excluded.bpm,
        tags = excluded.tags,
        chord_display_mode = excluded.chord_display_mode,
        deleted_at = null,
        updated_at = excluded.updated_at`,
      remoteSong.id,
      remoteSong.title,
      remoteSong.song_key,
      remoteSong.bpm,
      remoteSong.tags,
      localSongRow?.cover_uri ?? null,
      localSongRow?.created_by ?? null,
      remoteSong.chord_display_mode,
      toMillis(remoteSong.created_at) ?? now,
      now
    );

    await db.runAsync(
      `DELETE FROM lyric_lines
       WHERE section_id IN (
         SELECT id FROM sections WHERE song_id = ?
       )`,
      songId
    );
    await db.runAsync('DELETE FROM sections WHERE song_id = ?', songId);

    for (const section of remoteSections ?? []) {
      const restoredAudio = hydratedAudio.sectionAudio.get(section.id);

      await db.runAsync(
        `INSERT INTO sections (
          id,
          song_id,
          label,
          section_order,
          section_recording_uri,
          section_recording_duration
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        section.id,
        songId,
        section.label,
        section.section_order,
        restoredAudio?.localUri ?? null,
        restoredAudio?.durationSeconds ?? null
      );
    }

    for (const line of remoteLines ?? []) {
      const restoredAudio = hydratedAudio.lineAudio.get(line.id);

      await db.runAsync(
        `INSERT INTO lyric_lines (
          id,
          section_id,
          line_order,
          text,
          chords,
          memo,
          line_recording_uri,
          line_recording_duration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        line.id,
        line.section_id,
        line.line_order,
        line.text,
        line.chords,
        line.memo,
        restoredAudio?.localUri ?? null,
        restoredAudio?.durationSeconds ?? null
      );
    }

    await upsertSyncState(
      {
        entityType: 'song',
        entityId: songId,
        remoteId: songId,
        ownerId: userId,
        updatedBy: userId,
        syncStatus: 'synced',
        localUpdatedAt: now,
        remoteUpdatedAt: toMillis(remoteSong.updated_at) ?? now,
        lastSyncedAt: now,
        syncVersion: Number(remoteSong.sync_version ?? 0),
        deletedAt: null,
        lastError: null,
      },
      db
    );

    for (const section of currentSectionRows) {
      if (!(remoteSections ?? []).some((remote) => remote.id === section.id)) {
        await deleteSyncState('section', section.id, db);
      }
    }

    for (const line of currentLineRows) {
      if (!(remoteLines ?? []).some((remote) => remote.id === line.id)) {
        await deleteSyncState('line', line.id, db);
      }
    }

    for (const section of remoteSections ?? []) {
      await upsertSyncState(
        {
          entityType: 'section',
          entityId: section.id,
          remoteId: section.id,
          ownerId: userId,
          updatedBy: userId,
          syncStatus: 'synced',
          localUpdatedAt: now,
          remoteUpdatedAt: toMillis(section.updated_at) ?? now,
          lastSyncedAt: now,
          syncVersion: Number(section.sync_version ?? 0),
          deletedAt: null,
          lastError: null,
        },
        db
      );
    }

    for (const line of remoteLines ?? []) {
      await upsertSyncState(
        {
          entityType: 'line',
          entityId: line.id,
          remoteId: line.id,
          ownerId: userId,
          updatedBy: userId,
          syncStatus: 'synced',
          localUpdatedAt: now,
          remoteUpdatedAt: toMillis(line.updated_at) ?? now,
          lastSyncedAt: now,
          syncVersion: Number(line.sync_version ?? 0),
          deletedAt: null,
          lastError: null,
        },
        db
      );
    }
  });

  await cleanupRemovedLocalRecordings(
    currentSectionRows,
    currentLineRows,
    hydratedAudio.sectionAudio,
    hydratedAudio.lineAudio
  );

  emit('songs');
  emit(`song:${songId}`);
}
