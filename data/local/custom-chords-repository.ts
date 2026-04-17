import * as customChordsDb from '@/db/custom-chords';
import type { CustomChordsRepository } from '@/repositories/contracts';

export const localCustomChordsRepository: CustomChordsRepository = {
  list: customChordsDb.getAllCustomChords,
  create: customChordsDb.createCustomChord,
  update: customChordsDb.updateCustomChord,
  delete: customChordsDb.deleteCustomChord,
};
