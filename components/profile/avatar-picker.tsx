import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Props {
  avatarUrl: string | null;
  displayName: string | null;
  onPickUri: (uri: string) => void;
  loading?: boolean;
}

export function AvatarPicker({ avatarUrl, displayName, onPickUri, loading = false }: Props) {
  async function handlePress() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onPickUri(result.assets[0].uri);
    }
  }

  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Pressable onPress={handlePress} style={{ alignSelf: 'center' }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: Colors.accent,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 80, height: 80 }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.accentForeground }}>
            {initials}
          </Text>
        )}

        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator color={Colors.accentForeground} />
          </View>
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <IconSymbol name="pencil" size={12} color={Colors.textSecondary} />
      </View>
    </Pressable>
  );
}
