import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { TabStack } from '@/components/ui/tab-stack';

export default function AlbumsLayout() {
  const router = useRouter();
  return (
    <TabStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Albums',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/album/new')}
              style={{ paddingHorizontal: 8 }}
              hitSlop={8}
            >
              <IconSymbol name="plus" size={22} color={Colors.accent} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="[albumId]" options={{ headerLargeTitle: false }} />
    </TabStack>
  );
}
