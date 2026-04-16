import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDate } from '@/utils/format';
import type { BrainstormRow } from '@/types/song';

interface BrainstormCardProps {
  idea: BrainstormRow;
}

export function BrainstormCard({ idea }: BrainstormCardProps) {
  const router = useRouter();

  const preview = idea.text?.trim();

  return (
    <Pressable
      onPress={() => router.push(`/brainstorm/${idea.id}`)}
      style={({ pressed }) => ({
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        gap: 6,
        boxShadow: Shadows.card,
        borderWidth: 1,
        borderColor: Colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}
            numberOfLines={1}
          >
            {idea.title}
          </Text>

          {!!preview && (
            <Text
              style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}
              numberOfLines={2}
            >
              {preview}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Text style={{ fontSize: 12, color: Colors.textTertiary }}>
              {formatDate(idea.updatedAt)}
            </Text>
            {idea.recordingUri && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <IconSymbol name="waveform" size={12} color={Colors.textTertiary} />
                <Text style={{ fontSize: 12, color: Colors.textTertiary }}>Recording</Text>
              </View>
            )}
          </View>
        </View>

        <IconSymbol name="chevron.right" size={16} color={Colors.textTertiary} />
      </View>
    </Pressable>
  );
}
