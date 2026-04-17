import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCloudCapabilities } from '@/hooks/use-cloud-capabilities';
import { useCloudSongs } from '@/hooks/use-cloud-songs';
import { useDeletedSongs } from '@/hooks/use-deleted-songs';
import { useOwnerSyncStatus } from '@/hooks/use-owner-sync-status';
import { usePendingSongSyncs } from '@/hooks/use-pending-song-syncs';
import { useSongSyncIssues } from '@/hooks/use-song-sync-issues';
import { useSongs } from '@/hooks/use-songs';
import { getSupabaseClient } from '@/lib/supabase/client';
import { describeSongSyncState } from '@/lib/sync/sync-issues';
import { backupSongsToCloud, syncPendingSongs } from '@/lib/supabase/sync-coordinator';
import { pushSongToCloud, restoreSongFromCloud } from '@/lib/supabase/song-sync';
import { repositories } from '@/repositories';
import { formatDate } from '@/utils/format';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const cloud = useCloudCapabilities();
  const localSongs = useSongs();
  const deletedSongs = useDeletedSongs();
  const cloudSongs = useCloudSongs(auth.user?.id);
  const ownerSyncStatus = useOwnerSyncStatus();
  const pendingSongSyncs = usePendingSongSyncs();
  const syncIssues = useSongSyncIssues();
  const [syncingLibrary, setSyncingLibrary] = useState(false);
  const [restoringSongId, setRestoringSongId] = useState<string | null>(null);

  async function requireCloudClient() {
    const supabase = getSupabaseClient();
    if (!supabase || !auth.user) {
      Alert.alert('Account unavailable', 'Sign in again before using cloud song backup.');
      return null;
    }
    return { supabase, userId: auth.user.id };
  }

  async function handleBackupAllSongs() {
    if (!cloud.canUseCloudFeatures) {
      Alert.alert(
        'Cloud backup unavailable',
        'Sign in and complete your public profile before backing up songs to the cloud.'
      );
      return;
    }

    const client = await requireCloudClient();
    if (!client) return;

    if (localSongs.length === 0) {
      Alert.alert('No songs to back up', 'Create or import a song first.');
      return;
    }

    setSyncingLibrary(true);
    try {
      const result = await backupSongsToCloud(
        client.supabase,
        client.userId,
        localSongs.map((song) => song.id)
      );
      await cloudSongs.refresh();
      Alert.alert(
        'Cloud backup complete',
        result.failed.length === 0
          ? `${result.synced} ${result.synced === 1 ? 'song is' : 'songs are'} now backed up to your cloud library.`
          : `${result.synced} ${result.synced === 1 ? 'song is' : 'songs are'} now backed up to your cloud library. ${result.failed.length} ${result.failed.length === 1 ? 'song still needs attention' : 'songs still need attention'}.`
      );
    } catch (error) {
      Alert.alert(
        'Backup interrupted',
        error instanceof Error ? error.message : 'Something went wrong while backing up your songs.'
      );
    } finally {
      setSyncingLibrary(false);
    }
  }

  async function handleRetrySongBackup(songId: string) {
    if (!cloud.canUseCloudFeatures) {
      Alert.alert(
        'Cloud backup unavailable',
        'Sign in and complete your public profile before backing up songs to the cloud.'
      );
      return;
    }

    const client = await requireCloudClient();
    if (!client) return;

    setSyncingLibrary(true);
    try {
      await pushSongToCloud(client.supabase, client.userId, songId);
      await cloudSongs.refresh();
      Alert.alert('Backup complete', 'That song synced to your cloud library successfully.');
    } catch (error) {
      Alert.alert(
        'Backup failed',
        error instanceof Error ? error.message : 'Something went wrong while backing up this song.'
      );
    } finally {
      setSyncingLibrary(false);
    }
  }

  async function handleSyncPendingSongs() {
    if (!cloud.canUseCloudFeatures) {
      Alert.alert(
        'Cloud sync unavailable',
        'Sign in and complete your public profile before syncing pending song changes.'
      );
      return;
    }

    const client = await requireCloudClient();
    if (!client) return;

    if (pendingSongSyncs.length === 0) {
      Alert.alert('Nothing to sync', 'There are no pending song changes waiting for cloud sync.');
      return;
    }

    setSyncingLibrary(true);
    try {
      const result = await syncPendingSongs(client.supabase, client.userId);
      await cloudSongs.refresh();
      Alert.alert(
        'Pending sync complete',
        result.failed.length === 0
          ? `${result.synced} ${result.synced === 1 ? 'song was' : 'songs were'} synced successfully.`
          : `${result.synced} ${result.synced === 1 ? 'song was' : 'songs were'} synced successfully. ${result.failed.length} ${result.failed.length === 1 ? 'song still needs attention' : 'songs still need attention'}.`
      );
    } catch (error) {
      Alert.alert(
        'Sync interrupted',
        error instanceof Error ? error.message : 'Something went wrong while syncing pending songs.'
      );
    } finally {
      setSyncingLibrary(false);
    }
  }

  async function handleRestoreCloudSong(songId: string) {
    if (!cloud.canUseCloudFeatures) {
      Alert.alert(
        'Cloud restore unavailable',
        'Sign in and complete your public profile before restoring songs from the cloud.'
      );
      return;
    }

    const client = await requireCloudClient();
    if (!client) return;

    setRestoringSongId(songId);
    try {
      await restoreSongFromCloud(client.supabase, client.userId, songId);
      await cloudSongs.refresh();
      Alert.alert(
        'Song restored',
        'The selected cloud song is now available in your local library on this device.'
      );
    } catch (error) {
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Something went wrong while restoring this song.'
      );
    } finally {
      setRestoringSongId(null);
    }
  }

  async function handleRestoreDeletedSong(songId: string) {
    try {
      await repositories.songs.restore(songId);
      Alert.alert(
        'Song restored locally',
        cloud.canUseCloudFeatures
          ? 'The song is back in your local library and will be re-synced to the cloud on the next owner sync.'
          : 'The song is back in your local library on this device.'
      );
    } catch (error) {
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Something went wrong while restoring this deleted song.'
      );
    }
  }

  const localSongIds = new Set(localSongs.map((song) => song.id));
  const cloudSongIds = new Set(cloudSongs.songs.map((song) => song.id));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
          Settings
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Cloud account status and song sync controls live here.
        </Text>
      </View>

      {/* Cloud Account */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 16,
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
          Cloud Account
        </Text>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
            {cloud.accountTitle}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            {cloud.accountDescription}
          </Text>
          {auth.profile?.displayName && (
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
              Profile: {auth.profile.displayName}
            </Text>
          )}
          {cloud.needsProfileCompletion && (
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
              Complete your profile in the Me tab to enable sharing features.
            </Text>
          )}
        </View>

        {!auth.user && auth.isConfigured && (
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
              Sign In or Create Account
            </Text>
          </Pressable>
        )}

        {auth.user && (
          <Pressable
            onPress={async () => {
              const supabase = getSupabaseClient();
              if (!supabase) return;
              await supabase.auth.signOut();
            }}
            style={{
              backgroundColor: Colors.accentSubtle,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              Sign Out
            </Text>
          </Pressable>
        )}
      </View>

      {/* Cloud Song Library */}
      {auth.user && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
            Cloud Song Library
          </Text>

          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            Back up your local songs to the cloud, including section and line recordings, then restore them on another signed-in device.
          </Text>

          <View
            style={{
              backgroundColor: Colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
              {ownerSyncStatus.phase === 'syncing'
                ? 'Automatic owner sync is running'
                : ownerSyncStatus.phase === 'scheduled' && ownerSyncStatus.pendingCount > 0
                  ? 'Automatic owner sync is scheduled'
                  : 'Automatic owner sync is idle'}
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 18, color: Colors.textSecondary }}>
              {ownerSyncStatus.phase === 'syncing'
                ? `Trying to push ${ownerSyncStatus.pendingCount} pending ${ownerSyncStatus.pendingCount === 1 ? 'song change' : 'song changes'} in the background.`
                : ownerSyncStatus.phase === 'scheduled' && ownerSyncStatus.pendingCount > 0
                  ? `The app will retry ${ownerSyncStatus.pendingCount} pending ${ownerSyncStatus.pendingCount === 1 ? 'song change' : 'song changes'} when the cooldown window expires or the app resumes.`
                  : 'Pending cloud work will retry automatically when there is something to sync.'}
            </Text>
            {ownerSyncStatus.lastResult && (
              <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
                Last automatic run: {ownerSyncStatus.lastResult.synced} synced, {ownerSyncStatus.lastResult.failedCount} needing attention.
              </Text>
            )}
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              {localSongs.length} local songs · {cloudSongs.songs.length} cloud songs
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              {pendingSongSyncs.length} pending {pendingSongSyncs.length === 1 ? 'song change' : 'song changes'} · {syncIssues.length} needing attention
            </Text>
            {cloudSongs.error && (
              <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.destructive }}>
                {cloudSongs.error}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              disabled={syncingLibrary || restoringSongId !== null}
              onPress={() => { void handleBackupAllSongs(); }}
              style={{
                flex: 1,
                backgroundColor: Colors.accent,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: syncingLibrary || restoringSongId !== null ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentForeground }}>
                {syncingLibrary ? 'Backing Up...' : 'Back Up All Songs'}
              </Text>
            </Pressable>

            <Pressable
              disabled={syncingLibrary || restoringSongId !== null}
              onPress={() => { void handleSyncPendingSongs(); }}
              style={{
                flex: 1,
                backgroundColor: Colors.surfaceSubtle,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                opacity: syncingLibrary || restoringSongId !== null ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                Sync Pending Songs
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              disabled={syncingLibrary || restoringSongId !== null || cloudSongs.loading}
              onPress={() => { void cloudSongs.refresh(); }}
              style={{
                flex: 1,
                backgroundColor: Colors.surfaceSubtle,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                opacity: syncingLibrary || restoringSongId !== null || cloudSongs.loading ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                {cloudSongs.loading ? 'Refreshing...' : 'Refresh Cloud List'}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 10 }}>
            {cloudSongs.songs.length === 0 ? (
              <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
                No cloud songs yet. Back up a local song to create your first cloud copy.
              </Text>
            ) : (
              cloudSongs.songs.map((song) => (
                <View
                  key={song.id}
                  style={{
                    backgroundColor: Colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: 12,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                      {song.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                      {[song.key, song.bpm ? `${song.bpm} BPM` : null, `Cloud ${formatDate(song.updatedAt)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                      {localSongIds.has(song.id)
                        ? `Available locally · sync version ${song.syncVersion}`
                        : `Cloud only on this device · sync version ${song.syncVersion}`}
                    </Text>
                  </View>

                  <Pressable
                    disabled={syncingLibrary || restoringSongId !== null}
                    onPress={() => { void handleRestoreCloudSong(song.id); }}
                    style={{
                      backgroundColor: Colors.accentSubtle,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center',
                      opacity: syncingLibrary || restoringSongId !== null ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentSubtleForeground }}>
                      {restoringSongId === song.id
                        ? 'Restoring...'
                        : localSongIds.has(song.id)
                          ? 'Refresh Local Copy'
                          : 'Restore to This Device'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Sync Issues */}
      {syncIssues.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
            Sync Attention Needed
          </Text>

          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            These songs hit a cloud sync problem. Retry backup after correcting the issue, or restore the cloud copy if you want this device to match the remote version first.
          </Text>

          <View style={{ gap: 10 }}>
            {syncIssues.map(({ song, syncState, issue }) => (
              <View
                key={syncState.entityId}
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                    {song?.title ?? 'Unknown song'}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                    {issue.title}
                  </Text>
                  <Text style={{ fontSize: 13, lineHeight: 18, color: Colors.textSecondary }}>
                    {issue.detail}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
                    {describeSongSyncState(syncState)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    disabled={!issue.canRetry || syncingLibrary || restoringSongId !== null}
                    onPress={() => { void handleRetrySongBackup(syncState.entityId); }}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.accent,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center',
                      opacity: !issue.canRetry || syncingLibrary || restoringSongId !== null ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentForeground }}>
                      Retry Backup
                    </Text>
                  </Pressable>

                  {cloudSongIds.has(syncState.entityId) && (
                    <Pressable
                      disabled={syncingLibrary || restoringSongId !== null}
                      onPress={() => { void handleRestoreCloudSong(syncState.entityId); }}
                      style={{
                        flex: 1,
                        backgroundColor: Colors.surface,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: Colors.border,
                        opacity: syncingLibrary || restoringSongId !== null ? 0.6 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
                        Restore Cloud Copy
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recently Deleted */}
      {deletedSongs.length > 0 && (
        <View
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
            Recently Deleted Songs
          </Text>

          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            Deleted songs stay recoverable locally and can be synced back if you restore them.
          </Text>

          <View style={{ gap: 10 }}>
            {deletedSongs.map((song) => (
              <View
                key={song.id}
                style={{
                  backgroundColor: Colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                    {song.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                    {[song.key, song.bpm ? `${song.bpm} BPM` : null, song.deletedAt ? `Deleted ${formatDate(song.deletedAt)}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => { void handleRestoreDeletedSong(song.id); }}
                  style={{
                    backgroundColor: Colors.accentSubtle,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentSubtleForeground }}>
                    Restore Song
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        style={{
          backgroundColor: Colors.accentSubtle,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentSubtleForeground }}>
          Done
        </Text>
      </Pressable>
    </ScrollView>
  );
}
