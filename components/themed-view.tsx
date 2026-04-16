import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  surface?: boolean; // true = white card surface, false = app background
};

export function ThemedView({ style, surface = false, ...otherProps }: ThemedViewProps) {
  return (
    <View
      style={[{ backgroundColor: surface ? Colors.surface : Colors.background }, style]}
      {...otherProps}
    />
  );
}
