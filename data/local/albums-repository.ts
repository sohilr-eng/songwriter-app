import * as albumsDb from '@/db/albums';
import type { AlbumsRepository } from '@/repositories/contracts';

export const localAlbumsRepository: AlbumsRepository = {
  list: albumsDb.getAllAlbums,
  getById: albumsDb.getAlbumById,
  create: albumsDb.createAlbum,
  update: albumsDb.updateAlbum,
  delete: albumsDb.deleteAlbum,
  listSongs: albumsDb.getSongsInAlbum,
  addSong: albumsDb.addSongToAlbum,
  removeSong: albumsDb.removeSongFromAlbum,
};
