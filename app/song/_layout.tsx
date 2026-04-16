import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SongLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="new" options={{ title: 'New Song' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/settings" options={{ title: 'Song Settings' }} />
      <Stack.Screen name="[id]/snapshots" options={{ title: 'Versions' }} />
      <Stack.Screen name="[id]/chord-help" options={{ title: 'Chord Reference' }} />
    </Stack>
  );
}
