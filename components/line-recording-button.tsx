import { Pressable, View, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorderHook } from '@/hooks/use-audio-recorder';
import { useAudioPlayerHook } from '@/hooks/use-audio-player';
import { RecordingPulse } from './waveform-bar';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { getLineRecordingStorageKey } from '@/lib/audio/recordings';
import { formatDuration } from '@/utils/format';

interface LineRecordingButtonProps {
  lineId: string;
  existingUri: string | null;
  existingDuration: number | null;
  onSave: (uri: string, duration: number) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function LineRecordingButton({
  lineId,
  existingUri,
  existingDuration,
  onSave,
  onDelete,
}: LineRecordingButtonProps) {
  const storageKey = getLineRecordingStorageKey(lineId);
  const recorder = useAudioRecorderHook(storageKey);
  const activeUri = existingUri ?? recorder.savedUri;

  const hasRecording = !!activeUri;

  async function handlePress() {
    if (recorder.isRecording) {
      // Stop and save
      const uri = await recorder.stop();
      if (uri) await onSave(uri, recorder.currentTime);
    } else {
      // Start recording
      await recorder.start();
    }
  }

  async function handleLongPress() {
    if (!hasRecording && !recorder.isRecording) return;
    const uri = existingUri ?? recorder.savedUri;
    if (uri) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    recorder.reset();
    await onDelete();
  }

  // Recording in progress
  if (recorder.isRecording) {
    return (
      <Pressable onPress={handlePress} style={styles.container} hitSlop={8}>
        <RecordingPulse />
        <Text style={[styles.time, { color: Colors.destructive }]}>
          {formatDuration(recorder.currentTime)}
        </Text>
      </Pressable>
    );
  }

  // Has a saved recording
  if (hasRecording) {
    if (!activeUri) return null;
    return (
      <RecordedLineButton
        uri={activeUri}
        existingDuration={existingDuration}
        onDelete={handleLongPress}
      />
    );
  }

  // Idle
  return (
    <Pressable onPress={handlePress} style={styles.container} hitSlop={8}>
      <IconSymbol name="mic" size={15} color={Colors.textTertiary} />
    </Pressable>
  );
}

function RecordedLineButton({
  uri,
  existingDuration,
  onDelete,
}: {
  uri: string;
  existingDuration: number | null;
  onDelete: () => Promise<void>;
}) {
  const player = useAudioPlayerHook(uri);

  return (
    <Pressable
      onPress={player.togglePlayPause}
      onLongPress={() => {
        void onDelete();
      }}
      delayLongPress={500}
      style={styles.container}
      hitSlop={8}
    >
      <View style={styles.playDot}>
        <IconSymbol
          name={player.isPlaying ? 'pause.fill' : 'play.fill'}
          size={10}
          color={Colors.accentForeground}
        />
      </View>
      <Text style={styles.time}>
        {player.isPlaying
          ? formatDuration(player.currentTime)
          : formatDuration(existingDuration ?? player.duration)}
      </Text>
    </Pressable>
  );
}

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    padding: 4,
  },
  playDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.chordColor,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  time: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'] as any,
  },
};
