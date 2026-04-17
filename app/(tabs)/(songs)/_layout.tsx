import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { TabStack } from '@/components/ui/tab-stack';

export default function SongsLayout() {
  const router = useRouter();
  return (
    <TabStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Songs',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push('/settings')}
                style={{ paddingHorizontal: 8 }}
                hitSlop={8}
              >
                <IconSymbol name="gearshape" size={20} color={Colors.accent} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/song/new')}
                style={{ paddingHorizontal: 8 }}
                hitSlop={8}
              >
                <IconSymbol name="plus" size={22} color={Colors.accent} />
              </Pressable>
            </View>
          ),
        }}
      />
    </TabStack>
  );
}
