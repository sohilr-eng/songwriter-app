import { View, Text, Pressable, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import type { Snapshot } from '@/types/song';

interface SnapshotRowProps {
  snapshot: Snapshot;
  onRestore: (snapshot: Snapshot) => void;
  onDelete: (snapshot: Snapshot) => void;
}

export function SnapshotListRow({ snapshot, onRestore, onDelete }: SnapshotRowProps) {
  function handleRestore() {
    Alert.alert(
      'Restore Version',
      `Replace current lyrics with "${snapshot.label ?? 'this version'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => onRestore(snapshot) },
      ]
    );
  }

  function handleDelete() {
    Alert.alert('Delete Version', 'Remove this saved version?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(snapshot); } },
    ]);
  }

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        gap: 6,
        boxShadow: Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>
            {snapshot.label ?? 'Saved version'}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
            {formatDate(snapshot.createdAt)}
          </Text>
        </View>

        <Pressable
          onPress={handleRestore}
          style={({ pressed }) => ({
            backgroundColor: Colors.accent,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 9,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: Colors.accentForeground, fontWeight: '600', fontSize: 14 }}>
            Restore
          </Text>
        </Pressable>

        <Pressable onPress={handleDelete} hitSlop={10} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: Colors.textTertiary }}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}
