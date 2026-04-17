import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useAuthRedirectHandler } from '@/hooks/use-auth-redirect-handler';
import { useShareLinkHandler } from '@/hooks/use-share-link-handler';
import { useSupabaseBootstrap } from '@/hooks/use-supabase-bootstrap';
import { AuthProvider } from '@/providers/auth-provider';
import { OwnerSyncBootstrap } from '@/providers/owner-sync-bootstrap';

// Light theme only — override React Navigation defaults with our palette
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:   Colors.background,
    card:         Colors.surface,
    text:         Colors.textPrimary,
    border:       Colors.border,
    primary:      Colors.accent,
    notification: Colors.accent,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useShareLinkHandler();
  useSupabaseBootstrap();
  useAuthRedirectHandler();

  return (
    <AuthProvider>
      <OwnerSyncBootstrap />
      <ThemeProvider value={AppTheme}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.8, 1.0],
            title: 'Account',
          }} />
          <Stack.Screen name="auth-callback" options={{
            headerShown: false,
            presentation: 'transparentModal',
          }} />
          <Stack.Screen name="settings" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.45, 1.0],
            title: 'Settings',
          }} />
          <Stack.Screen name="import-song" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.4, 1.0],
            title: 'Import Song',
          }} />
          <Stack.Screen name="song-preview" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [1.0],
            title: 'Preview Song',
          }} />

          {/* Song screens */}
          <Stack.Screen name="song/new" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.55, 1.0],
            title: 'New Song',
          }} />
          <Stack.Screen name="song/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="song/[id]/settings" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.75, 1.0],
            title: 'Song Settings',
          }} />
          <Stack.Screen name="song/[id]/snapshots" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.75, 1.0],
            title: 'Versions',
          }} />
          <Stack.Screen name="song/[id]/chord-help" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.5, 1.0],
            title: 'Chord Reference',
          }} />
          <Stack.Screen name="song/[id]/share" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.65, 1.0],
            title: 'Share Song',
          }} />
          <Stack.Screen name="song/[id]/members" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.75, 1.0],
            title: 'Collaborators',
          }} />
          <Stack.Screen name="song/[id]/view" options={{ headerShown: false }} />

          {/* Public shared song view (no auth required) */}
          <Stack.Screen name="shared/[token]" options={{ headerShown: false }} />

          {/* Invite redemption */}
          <Stack.Screen name="invite/[token]" options={{ headerShown: false }} />

          {/* Album screens */}
          <Stack.Screen name="album/new" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.45, 1.0],
            title: 'New Album',
          }} />
          <Stack.Screen name="albums/[albumId]" options={{ headerShown: false }} />

          {/* Brainstorm screens */}
          <Stack.Screen name="brainstorm/new" options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.55, 1.0],
            title: 'New Idea',
          }} />
          <Stack.Screen name="brainstorm/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
