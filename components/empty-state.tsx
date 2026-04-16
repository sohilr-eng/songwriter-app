import { View, Pressable, Text } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
      <IconSymbol name={icon} size={48} color={Colors.textTertiary} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 8,
            backgroundColor: Colors.accent,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: Colors.accentForeground, fontWeight: '600', fontSize: 15 }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
