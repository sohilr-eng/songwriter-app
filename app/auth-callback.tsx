import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      router.replace('/');
    }
  }, [auth.isLoading, auth.user, router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <ActivityIndicator size="small" color={Colors.accent} />
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.textPrimary }}>
          Finishing sign in
        </Text>
        <Text
          style={{
            maxWidth: 320,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
            color: Colors.textSecondary,
          }}
        >
          The app is applying your session and will return to your library automatically.
        </Text>
      </View>
    </ScrollView>
  );
}
