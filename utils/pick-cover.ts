import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const COVERS_DIR = FileSystem.documentDirectory + 'covers/';

/**
 * Opens the camera roll with a 1:1 square crop.
 * Copies the result to persistent documentDirectory storage.
 * Returns the local file URI, or null if cancelled / permission denied.
 */
export async function pickCover(id: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled) return null;

  await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });

  const dest = COVERS_DIR + id + '.jpg';
  await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
  return dest;
}

/**
 * Deletes the cover file for a given id, if it exists.
 */
export async function deleteCover(id: string): Promise<void> {
  const path = COVERS_DIR + id + '.jpg';
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
