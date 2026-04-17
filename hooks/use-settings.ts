import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';

const DISPLAY_NAME_KEY = 'display_name';
const PROFILE_AVATAR_URI_KEY = 'profile_avatar_uri';

export function useDisplayName() {
  const [displayName, setDisplayNameState] = useState<string>('');

  useEffect(() => {
    async function load() {
      const value = await repositories.settings.get(DISPLAY_NAME_KEY);
      setDisplayNameState(value ?? '');
    }

    void load();
    const unsub = subscribe(`settings:${DISPLAY_NAME_KEY}`, () => {
      void load();
    });
    return unsub;
  }, []);

  async function setDisplayName(value: string) {
    await repositories.settings.set(DISPLAY_NAME_KEY, value.trim());
  }

  return { displayName, setDisplayName };
}

export function useProfileAvatarUri() {
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const value = await repositories.settings.get(PROFILE_AVATAR_URI_KEY);
      setAvatarUriState(value || null);
    }

    void load();
    const unsub = subscribe(`settings:${PROFILE_AVATAR_URI_KEY}`, () => {
      void load();
    });
    return unsub;
  }, []);

  async function setAvatarUri(value: string | null) {
    await repositories.settings.set(PROFILE_AVATAR_URI_KEY, value ?? '');
  }

  return { avatarUri, setAvatarUri };
}
