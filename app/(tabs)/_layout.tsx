import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="(songs)"
        options={{
          title: 'Songs',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="music.note" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(albums)"
        options={{
          title: 'Albums',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="rectangle.stack.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(brainstorm)"
        options={{
          title: 'Brainstorm',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="lightbulb.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
