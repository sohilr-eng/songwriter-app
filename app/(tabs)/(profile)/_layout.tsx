import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Me' }} />
    </Stack>
  );
}
