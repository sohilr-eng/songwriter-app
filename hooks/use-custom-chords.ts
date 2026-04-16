import { useCallback, useEffect, useState } from 'react';
import {
  createCustomChord,
  deleteCustomChord,
  getAllCustomChords,
  updateCustomChord,
} from '@/db/custom-chords';
import { subscribe } from '@/db/events';
import type { CustomChord } from '@/types/chord';

export function useCustomChords() {
  const [chords, setChords] = useState<CustomChord[]>([]);

  const load = useCallback(async () => {
    const all = await getAllCustomChords();
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
    createChord: createCustomChord,
    updateChord: updateCustomChord,
    deleteChord: deleteCustomChord,
  };
}
