import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

function isShareFile(url: string | null | undefined) {
  return !!url && /\.swsong($|\?)/i.test(url);
}

export function useShareLinkHandler() {
  const router = useRouter();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    async function handleInitialUrl() {
      const url = await Linking.getInitialURL();
      if (!isShareFile(url) || lastUrl.current === url) return;
      lastUrl.current = url;
      router.push({ pathname: '/import-song', params: { path: url } });
    }

    function handleUrl({ url }: { url: string }) {
      if (!isShareFile(url) || lastUrl.current === url) return;
      lastUrl.current = url;
      router.push({ pathname: '/import-song', params: { path: url } });
    }

    void handleInitialUrl();
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => {
      subscription.remove();
    };
  }, [router]);
}
