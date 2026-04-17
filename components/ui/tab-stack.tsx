import { Stack } from 'expo-router/stack';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';

const tabScreenOptions: ComponentProps<typeof Stack>['screenOptions'] = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerTitle: ({ children }) => (
    <Text
      style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 17 }}
      numberOfLines={1}
    >
      {children}
    </Text>
  ),
  headerShadowVisible: false,
  headerLargeTitle: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: Colors.background },
};

export function TabStack({ children, ...props }: ComponentProps<typeof Stack>) {
  return (
    <Stack screenOptions={tabScreenOptions} {...props}>
      {children}
    </Stack>
  );
}
