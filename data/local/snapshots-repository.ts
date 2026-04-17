import * as snapshotsDb from '@/db/snapshots';
import type { SnapshotsRepository } from '@/repositories/contracts';

export const localSnapshotsRepository: SnapshotsRepository = {
  listForSong: snapshotsDb.getSnapshotsForSong,
  create: snapshotsDb.createSnapshot,
  delete: snapshotsDb.deleteSnapshot,
  restore: snapshotsDb.restoreSnapshot,
};
