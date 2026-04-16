import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function SongsLayout() {
  const router = useRouter();
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
      <Stack.Screen
        name="index"
        options={{
          title: 'Songs',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/song/new')}
              style={{ paddingHorizontal: 8 }}
              hitSlop={8}
            >
              <IconSymbol name="plus" size={22} color={Colors.accent} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
