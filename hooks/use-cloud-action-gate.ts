import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCloudCapabilities } from '@/hooks/use-cloud-capabilities';

interface CloudActionGateOptions {
  featureName: string;
  onAllowed?: () => void;
}

export function useCloudActionGate() {
  const router = useRouter();
  const cloud = useCloudCapabilities();

  function requireCloudAccess(options: CloudActionGateOptions): boolean {
    if (!cloud.isConfigured) {
      Alert.alert(
        `${options.featureName} unavailable`,
        'Cloud features are not configured yet on this build. Add the Supabase environment variables and restart the app.'
      );
      return false;
    }

    if (!cloud.isAuthenticated) {
      Alert.alert(
        'Sign in required',
        `Sign in to use ${options.featureName.toLowerCase()}. Local drafting will still remain available without an account.`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/auth'),
          },
        ]
      );
      return false;
    }

    if (cloud.needsProfileCompletion) {
      Alert.alert(
        'Complete profile first',
        `Add a public display name before using ${options.featureName.toLowerCase()} so collaborators can recognize your work.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => router.push('/settings'),
          },
        ]
      );
      return false;
    }

    options.onAllowed?.();
    return true;
  }

  return {
    cloud,
    requireCloudAccess,
  };
}
