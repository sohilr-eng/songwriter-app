import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface CoverImageProps {
  uri: string | null;
  size: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CoverImage({ uri, size, onPress, style }: CoverImageProps) {
  const radius = size * 0.12;

  const content = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius }}
      contentFit="cover"
      transition={150}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: Colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconSymbol name="music.note" size={size * 0.38} color={Colors.textTertiary} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}
