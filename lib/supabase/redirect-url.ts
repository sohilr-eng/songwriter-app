import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const FALLBACK_APP_SCHEME = 'songwriterapp2026';
const AUTH_CALLBACK_PATH = 'auth-callback';

function getAppScheme(): string {
  const configuredScheme = Constants.expoConfig?.scheme;
  if (typeof configuredScheme === 'string' && configuredScheme.trim().length > 0) {
    return configuredScheme.trim();
  }

  return FALLBACK_APP_SCHEME;
}

export function getAuthRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return Linking.createURL(AUTH_CALLBACK_PATH);
  }

  return Linking.createURL(AUTH_CALLBACK_PATH, {
    scheme: getAppScheme(),
  });
}

export function isNativeAuthRedirectSupported(): boolean {
  return (
    Platform.OS === 'web' ||
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

export function getNativeAuthRedirectSupportMessage(): string {
  return `Email confirmation links and social sign-in callbacks require a development build or production app build. Expo Go cannot reliably receive the app callback ${getAppScheme()}://auth-callback. Run a native build with npx expo run:ios or npx expo run:android before testing auth locally.`;
}
