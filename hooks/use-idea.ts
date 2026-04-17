import { useEffect, useState } from 'react';
import { subscribe } from '@/app-events';
import { repositories } from '@/repositories';
import type { BrainstormIdea } from '@/types/song';

export function useIdea(id: string): BrainstormIdea | null {
  const [idea, setIdea] = useState<BrainstormIdea | null>(null);

  useEffect(() => {
    repositories.brainstorm.getById(id).then(setIdea);
    const unsub = subscribe(`idea:${id}`, () => {
      repositories.brainstorm.getById(id).then(setIdea);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return idea;
}
