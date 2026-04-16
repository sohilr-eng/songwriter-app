import type { ChordShape } from '@/utils/chord-shapes';

export interface CustomChord {
  id: string;
  name: string;
  shape: ChordShape;
  createdAt: number;
  updatedAt: number;
}
