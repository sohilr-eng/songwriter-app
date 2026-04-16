import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlbums } from '@/hooks/use-albums';
import { AlbumCard } from '@/components/album-card';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';

export default function AlbumsScreen() {
  const albums = useAlbums();
  const router = useRouter();

  return (
    <FlatList
      data={albums}
      keyExtractor={item => item.id}
      numColumns={2}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      columnWrapperStyle={{ gap: 12 }}
      style={{ backgroundColor: Colors.background }}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <AlbumCard album={item} />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="rectangle.stack.fill"
          title="No albums yet"
          subtitle="Group your songs into albums"
          actionLabel="New Album"
          onAction={() => router.push('/album/new')}
        />
      }
    />
  );
}
