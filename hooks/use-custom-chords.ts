import { useCallback, useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { CustomChord } from '@/types/chord';

export function useCustomChords() {
  const [chords, setChords] = useState<CustomChord[]>([]);

  const load = useCallback(async () => {
    const all = await repositories.customChords.list();
    setChords(all);
  }, []);

  useEffect(() => {
    void load();
    return subscribe('custom_chords', () => {
      void load();
    });
  }, [load]);

  return {
    chords,
    createChord: repositories.customChords.create,
    updateChord: repositories.customChords.update,
    deleteChord: repositories.customChords.delete,
  };
}
