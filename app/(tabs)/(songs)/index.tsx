import { FlatList } from 'react-native';
import { useSongs } from '@/hooks/use-songs';
import { SongCard } from '@/components/song-card';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function SongsScreen() {
  const songs = useSongs();
  const router = useRouter();

  return (
    <FlatList
      data={songs}
      keyExtractor={item => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
        gap: 10,
        flexGrow: 1,
      }}
      style={{ backgroundColor: Colors.background }}
      renderItem={({ item }) => <SongCard song={item} />}
      ListEmptyComponent={
        <EmptyState
          icon="music.note"
          title="No songs yet"
          subtitle="Tap + to write your first song"
          actionLabel="New Song"
          onAction={() => router.push('/song/new')}
        />
      }
    />
  );
}
