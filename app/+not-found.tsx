import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
      }}
    >
      <IconSymbol name="nosign" size={48} color={Colors.textTertiary} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.textPrimary }}>
          Page not found
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>
          {'This screen doesn\'t exist.'}
        </Text>
      </View>
      <Pressable
        onPress={() => router.replace('/(tabs)')}
        style={({ pressed }) => ({
          backgroundColor: Colors.accent,
          borderRadius: 12,
          paddingHorizontal: 24,
          paddingVertical: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 15 }}>
          Go home
        </Text>
      </Pressable>
    </View>
  );
}
