import { getCloudCapabilities } from '@/lib/cloud/capabilities';
import { useAuth } from '@/hooks/use-auth';

export function useCloudCapabilities() {
  const auth = useAuth();
  return getCloudCapabilities(auth);
}
