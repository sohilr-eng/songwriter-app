import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useBrainstorm } from '@/hooks/use-brainstorm';
import { BrainstormCard } from '@/components/brainstorm-card';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';

export default function BrainstormScreen() {
  const ideas = useBrainstorm();
  const router = useRouter();

  return (
    <FlatList
      data={ideas}
      keyExtractor={item => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1, paddingBottom: 32 }}
      style={{ backgroundColor: Colors.background }}
      renderItem={({ item }) => <BrainstormCard idea={item} />}
      ListEmptyComponent={
        <EmptyState
          icon="lightbulb.fill"
          title="No ideas yet"
          subtitle="Capture rough ideas, melodies, and fragments here"
          actionLabel="New Idea"
          onAction={() => router.push('/brainstorm/new')}
        />
      }
    />
  );
}
