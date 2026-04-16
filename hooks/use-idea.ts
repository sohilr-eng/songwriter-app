import { useEffect, useState } from 'react';
import { getIdeaById } from '@/db/brainstorm';
import { subscribe } from '@/db/events';
import type { BrainstormRow } from '@/types/song';

export function useIdea(id: string): BrainstormRow | null {
  const [idea, setIdea] = useState<BrainstormRow | null>(null);

  useEffect(() => {
    getIdeaById(id).then(setIdea);
    const unsub = subscribe(`idea:${id}`, () => {
      getIdeaById(id).then(setIdea);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return idea;
}
