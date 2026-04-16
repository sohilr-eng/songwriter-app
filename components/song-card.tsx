import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CoverImage } from './cover-image';
import { IconSymbol } from './ui/icon-symbol';
import { Colors, Shadows } from '@/constants/theme';
import { formatDate } from '@/utils/format';
import type { SongRow } from '@/types/song';

interface SongCardProps {
  song: SongRow;
  onDelete?: (id: string) => void;
}

export function SongCard({ song, onDelete }: SongCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/song/${song.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        boxShadow: Shadows.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <CoverImage uri={song.coverUri} size={52} />

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
          {[song.key, song.bpm ? `${song.bpm} BPM` : null]
            .filter(Boolean).join(' · ') || formatDate(song.updatedAt)}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push(`/song/${song.id}/settings`)}
        hitSlop={12}
        style={{ padding: 4 }}
      >
        <IconSymbol name="ellipsis" size={20} color={Colors.icon} />
      </Pressable>
    </Pressable>
  );
}
