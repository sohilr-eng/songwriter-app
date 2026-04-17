import { localAlbumsRepository } from '@/data/local/albums-repository';
import { localBrainstormRepository } from '@/data/local/brainstorm-repository';
import { localCustomChordsRepository } from '@/data/local/custom-chords-repository';
import { localSettingsRepository } from '@/data/local/settings-repository';
import { localSnapshotsRepository } from '@/data/local/snapshots-repository';
import { localSongsRepository } from '@/data/local/songs-repository';

export const repositories = {
  albums: localAlbumsRepository,
  brainstorm: localBrainstormRepository,
  customChords: localCustomChordsRepository,
  settings: localSettingsRepository,
  snapshots: localSnapshotsRepository,
  songs: localSongsRepository,
};
