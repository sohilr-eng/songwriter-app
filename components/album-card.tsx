import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { IconSymbol } from './ui/icon-symbol';
import { Colors, Shadows } from '@/constants/theme';
import type { Album } from '@/types/song';

interface AlbumCardProps {
  album: Album;
  songCount?: number;
}

export function AlbumCard({ album, songCount }: AlbumCardProps) {
  const router = useRouter();
  const ART_SIZE = '100%';

  return (
    <Pressable
      onPress={() => router.push(`/albums/${album.id}`)}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: Shadows.card,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      {/* Artwork — square */}
      <View style={{ aspectRatio: 1, width: ART_SIZE }}>
        {album.artwork ? (
          <Image
            source={{ uri: album.artwork }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.surfaceSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderSubtle,
            }}
          >
            <IconSymbol name="rectangle.stack.fill" size={36} color={Colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Title + count */}
      <View style={{ padding: 12, gap: 2 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}
          numberOfLines={1}
        >
          {album.title}
        </Text>
        {songCount !== undefined && (
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            {songCount === 1 ? '1 song' : `${songCount} songs`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
