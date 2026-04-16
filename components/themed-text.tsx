import { Text, type TextProps } from 'react-native';
import { Colors } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption';
  color?: string;
};

export function ThemedText({ style, type = 'default', color, ...rest }: ThemedTextProps) {
  const textColor = color ?? (type === 'link' ? Colors.accent : Colors.textPrimary);

  return (
    <Text
      style={[
        { color: textColor },
        type === 'default'        && { fontSize: 16, lineHeight: 24 },
        type === 'defaultSemiBold'&& { fontSize: 16, lineHeight: 24, fontWeight: '600' },
        type === 'title'          && { fontSize: 28, fontWeight: '700', lineHeight: 34 },
        type === 'subtitle'       && { fontSize: 20, fontWeight: '600' },
        type === 'link'           && { fontSize: 16, lineHeight: 24 },
        type === 'caption'        && { fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
        style,
      ]}
      {...rest}
    />
  );
}
