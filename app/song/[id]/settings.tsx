import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { subscribe } from '@/app-events';
import { useCloudActionGate } from '@/hooks/use-cloud-action-gate';
import { useOwnerSyncStatus } from '@/hooks/use-owner-sync-status';
import { useSongSyncState } from '@/hooks/use-song-sync-state';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { describeSongSyncState, getSongSyncIssue } from '@/lib/sync/sync-issues';
import { pushSongToCloud, restoreSongFromCloud } from '@/lib/supabase/song-sync';
import { repositories } from '@/repositories';
import { pickCover, deleteCover } from '@/utils/pick-cover';
import { CoverImage } from '@/components/cover-image';
import { Colors } from '@/constants/theme';
import type { SongKey, SongSummary } from '@/types/song';

const KEYS: SongKey[] = [
  'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
  'Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','Am','Bbm','Bm',
];

export default function SongSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const { cloud, requireCloudAccess } = useCloudActionGate();
  const ownerSyncStatus = useOwnerSyncStatus();
  const songSyncState = useSongSyncState(id);
  const [song, setSong] = useState<SongSummary | null>(null);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState<SongKey | null>(null);
  const [bpm, setBpm] = useState('');
  const [syncingAction, setSyncingAction] = useState<'push' | 'pull' | null>(null);

  useEffect(() => {
    async function loadSong() {
      const s = await repositories.songs.getById(id);
      if (!s) return;
      setSong(s);
      setTitle(s.title);
      setKey(s.key);
      setBpm(s.bpm ? String(s.bpm) : '');
    }

    void loadSong();
    return subscribe(`song:${id}`, () => {
      void loadSong();
    });
  }, [id]);

  async function handleSave() {
    await repositories.songs.update(id, {
      title: title.trim() || song!.title,
      key: key ?? null,
      bpm: bpm ? parseInt(bpm, 10) : null,
    });
    router.dismiss();
  }

  async function handleChangeCover() {
    const uri = await pickCover(id);
    if (uri) {
      await repositories.songs.update(id, { coverUri: uri });
      setSong(prev => prev ? { ...prev, coverUri: uri } : prev);
    }
  }

  async function handleRemoveCover() {
    await deleteCover(id);
    await repositories.songs.update(id, { coverUri: null });
    setSong(prev => prev ? { ...prev, coverUri: null } : prev);
  }

  async function handleDelete() {
    Alert.alert('Delete Song', `Delete "${song?.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await repositories.songs.delete(id);
          router.dismissAll();
        },
      },
    ]);
  }

  function handlePrepareCloudSong() {
    requireCloudAccess({
      featureName: 'cloud backup and collaboration',
      onAllowed: () => {
        Alert.alert(
          'Account ready',
          'This account is ready for cloud backup today, and for sharing and collaboration as those phases land.'
        );
      },
    });
  }

  function getSyncDescription() {
    if (!songSyncState && !cloud.canUseCloudFeatures) {
      return 'This song is still local-only.';
    }

    return describeSongSyncState(songSyncState);
  }

  const syncIssue = getSongSyncIssue(songSyncState);

  async function handleBackupNow() {
    if (
      !requireCloudAccess({
        featureName: 'cloud backup and collaboration',
      })
    ) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !auth.user) {
      Alert.alert('Account unavailable', 'Sign in again before backing up this song.');
      return;
    }

    setSyncingAction('push');
    try {
      await pushSongToCloud(supabase, auth.user.id, id);
      Alert.alert('Backup complete', 'This song is now backed up to your cloud account.');
    } catch (error) {
      Alert.alert(
        'Backup failed',
        error instanceof Error ? error.message : 'Something went wrong while backing up this song.'
      );
    } finally {
      setSyncingAction(null);
    }
  }

  async function handleRestoreFromCloud() {
    if (
      !requireCloudAccess({
        featureName: 'cloud backup and collaboration',
      })
    ) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !auth.user) {
      Alert.alert('Account unavailable', 'Sign in again before restoring this song.');
      return;
    }

    setSyncingAction('pull');
    try {
      await restoreSongFromCloud(supabase, auth.user.id, id);
      Alert.alert(
        'Restore complete',
        'The local copy of this song has been refreshed from your cloud backup.'
      );
    } catch (error) {
      Alert.alert(
        'Restore failed',
        error instanceof Error ? error.message : 'Something went wrong while restoring this song.'
      );
    } finally {
      setSyncingAction(null);
    }
  }

  if (!song) return null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 24 }}
      style={{ backgroundColor: Colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cover image */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <CoverImage uri={song.coverUri} size={100} onPress={handleChangeCover} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleChangeCover}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.accentSubtle, borderRadius: 10 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.accentSubtleForeground }}>
              Change Cover
            </Text>
          </Pressable>
          {song.coverUri && (
            <Pressable
              onPress={handleRemoveCover}
              style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.accentSubtle, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.destructive }}>
                Remove
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 16,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: Colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Cloud Readiness
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          {cloud.canUseCloudFeatures
            ? 'Your account is ready for cloud backup on this song now, with share-access and collaboration features ready to build on top later.'
            : 'This song is still local-first. Sign in and complete your profile now so cloud backup and collaboration can be enabled cleanly when that phase lands.'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          {getSyncDescription()}
        </Text>
        {syncIssue && (
          <View
            style={{
              backgroundColor: Colors.surfaceSubtle,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: 12,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
              {syncIssue.title}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              {syncIssue.detail}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textTertiary }}>
              {syncIssue.kind === 'auth'
                ? 'Refreshing your session or signing in again should usually clear this.'
                : syncIssue.kind === 'configuration'
                  ? 'This device still needs working Supabase configuration before retrying.'
                  : syncIssue.kind === 'remote_missing'
                    ? 'If the cloud copy is the source of truth, restore it before retrying backup.'
                    : 'Retry backup after correcting the issue.'}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Backup and restore currently include the live song document plus section and line recordings.
        </Text>
        {ownerSyncStatus.phase !== 'idle' && ownerSyncStatus.pendingCount > 0 && (
          <Text style={{ fontSize: 13, lineHeight: 18, color: Colors.textTertiary }}>
            {ownerSyncStatus.phase === 'syncing'
              ? 'Background owner sync is running for pending song changes now.'
              : 'Background owner sync is scheduled to retry pending song changes automatically.'}
          </Text>
        )}
        <Pressable
          onPress={handlePrepareCloudSong}
          style={({ pressed }) => ({
            backgroundColor: Colors.accentSubtle,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentSubtleForeground }}>
            {cloud.canUseCloudFeatures ? 'Check Cloud Readiness' : 'Set Up Cloud Access'}
          </Text>
        </Pressable>
        <Pressable
          disabled={syncingAction !== null}
          onPress={() => {
            void handleBackupNow();
          }}
          style={({ pressed }) => ({
            backgroundColor: Colors.accent,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: syncingAction !== null ? 0.6 : pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accentForeground }}>
            {syncingAction === 'push' ? 'Backing Up...' : 'Back Up Song Now'}
          </Text>
        </Pressable>
        <Pressable
          disabled={syncingAction !== null}
          onPress={() => {
            void handleRestoreFromCloud();
          }}
          style={({ pressed }) => ({
            backgroundColor: Colors.surface,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
            opacity: syncingAction !== null ? 0.6 : pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
            {syncingAction === 'pull' ? 'Restoring...' : 'Restore Song from Cloud'}
          </Text>
        </Pressable>
      </View>

      {/* Title */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: Colors.textPrimary,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />
      </View>

      {/* Key */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Key
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
            {KEYS.map(k => (
              <Pressable
                key={k}
                onPress={() => setKey(key === k ? null : k)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: key === k ? Colors.accent : Colors.surface,
                  borderWidth: 1,
                  borderColor: key === k ? Colors.accent : Colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: key === k ? Colors.accentForeground : Colors.textPrimary }}>
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* BPM */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          BPM
        </Text>
        <TextInput
          value={bpm}
          onChangeText={t => setBpm(t.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 120"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: Colors.textPrimary,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />
      </View>

      {/* Save */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => ({
          backgroundColor: Colors.accent,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 16 }}>
          Save Changes
        </Text>
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => ({
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: Colors.destructive, fontWeight: '600', fontSize: 15 }}>
          Delete Song
        </Text>
      </Pressable>
    </ScrollView>
  );
}
