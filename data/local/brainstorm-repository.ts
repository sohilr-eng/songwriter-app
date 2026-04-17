import * as brainstormDb from '@/db/brainstorm';
import type { BrainstormRepository } from '@/repositories/contracts';

export const localBrainstormRepository: BrainstormRepository = {
  list: brainstormDb.getAllIdeas,
  getById: brainstormDb.getIdeaById,
  create: brainstormDb.createIdea,
  update: brainstormDb.updateIdea,
  delete: brainstormDb.deleteIdea,
};
