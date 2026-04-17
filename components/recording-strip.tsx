import { Alert, Pressable, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorderHook } from '@/hooks/use-audio-recorder';
import { useAudioPlayerHook } from '@/hooks/use-audio-player';
import { PlaybackBar, RecordingPulse } from './waveform-bar';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { formatDuration } from '@/utils/format';

interface RecordingStripProps {
  /** Unique key used as filename: e.g. "section-<id>" */
  storageKey: string;
  /** Existing recording URI (from DB), if any */
  existingUri: string | null;
  onSave: (uri: string, duration: number) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function RecordingStrip({
  storageKey,
  existingUri,
  onSave,
  onDelete,
}: RecordingStripProps) {
  const recorder = useAudioRecorderHook(storageKey);

  const hasRecording = !!(existingUri || recorder.savedUri);

  async function handleStopAndSave() {
    const uri = await recorder.stop();
    if (uri) {
      await onSave(uri, recorder.currentTime);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete Recording', 'Remove this voice memo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const uri = existingUri ?? recorder.savedUri;
          if (uri) {
            await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
          }
          recorder.reset();
          await onDelete();
        },
      },
    ]);
  }

  // ── Recording state ──────────────────────────────────────────────────────
  if (recorder.isRecording) {
    return (
      <View style={styles.strip}>
        <RecordingPulse />
        <Text style={[styles.time, { color: Colors.destructive }]}>
          {formatDuration(recorder.currentTime)}
        </Text>
        <Text style={styles.label}>Recording…</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleStopAndSave}
          style={styles.stopBtn}
        >
          <IconSymbol name="stop.fill" size={14} color={Colors.accentForeground} />
          <Text style={styles.stopLabel}>Stop</Text>
        </Pressable>
      </View>
    );
  }

  // ── Has recording ────────────────────────────────────────────────────────
  if (hasRecording) {
    const activeUri = existingUri ?? recorder.savedUri;
    if (!activeUri) return null;
    return (
      <RecordedStrip
        uri={activeUri}
        onDelete={handleDelete}
      />
    );
  }

  // ── Idle state ───────────────────────────────────────────────────────────
  return (
    <Pressable
      onPress={recorder.start}
      style={({ pressed }) => [styles.strip, styles.idleStrip, { opacity: pressed ? 0.7 : 1 }]}
    >
      <IconSymbol name="mic" size={16} color={Colors.textTertiary} />
      <Text style={styles.idleLabel}>
        {recorder.error ?? 'Record voice memo'}
      </Text>
    </Pressable>
  );
}

function RecordedStrip({
  uri,
  onDelete,
}: {
  uri: string;
  onDelete: () => Promise<void>;
}) {
  const player = useAudioPlayerHook(uri);

  return (
    <View style={styles.strip}>
      <Pressable onPress={player.togglePlayPause} style={styles.playBtn} hitSlop={8}>
        <IconSymbol
          name={player.isPlaying ? 'pause.fill' : 'play.fill'}
          size={16}
          color={Colors.accentForeground}
        />
      </Pressable>

      <PlaybackBar progress={player.progress} />

      <Text style={styles.time}>
        {player.isPlaying
          ? formatDuration(player.currentTime)
          : formatDuration(player.duration)}
      </Text>

      <Pressable onPress={() => { void onDelete(); }} hitSlop={10} style={{ padding: 4 }}>
        <IconSymbol name="trash" size={16} color={Colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = {
  strip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceSubtle,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  idleStrip: {
    justifyContent: 'center' as const,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  idleLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  time: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: 'right' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stopBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.destructive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stopLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accentForeground,
  },
};
