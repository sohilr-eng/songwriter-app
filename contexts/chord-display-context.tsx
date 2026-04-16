import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { ChordDisplayMode } from '@/types/song';

const ChordDisplayContext = createContext<ChordDisplayMode>('both');

interface ChordDisplayProviderProps extends PropsWithChildren {
  mode: ChordDisplayMode;
}

export function ChordDisplayProvider({ mode, children }: ChordDisplayProviderProps) {
  return (
    <ChordDisplayContext.Provider value={mode}>
      {children}
    </ChordDisplayContext.Provider>
  );
}

export function useChordDisplay() {
  return useContext(ChordDisplayContext);
}
