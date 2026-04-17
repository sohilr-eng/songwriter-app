import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';

const DISPLAY_NAME_KEY = 'display_name';

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
