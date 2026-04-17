import { Stack } from 'expo-router/stack';
import { TabStack } from '@/components/ui/tab-stack';

export default function ProfileLayout() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: 'Me' }} />
    </TabStack>
  );
}
