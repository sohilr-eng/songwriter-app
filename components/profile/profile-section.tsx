import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: Props) {
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.6 }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}
