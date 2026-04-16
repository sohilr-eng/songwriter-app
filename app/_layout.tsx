import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/constants/theme';

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
  return (
    <ThemeProvider value={AppTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

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
  );
}
