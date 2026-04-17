import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { SongSheetView } from '@/components/song-sheet-view';
import { Colors } from '@/constants/theme';
import { decodeSong, shareableToViewData, writePreviewAudioFiles } from '@/utils/share-codec';
import type { SongViewData } from '@/types/share';

export default function SongPreviewScreen() {
  const { path } = useLocalSearchParams<{ path: string }>();
  const [data, setData] = useState<SongViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const json = await FileSystem.readAsStringAsync(path);
        const shareable = decodeSong(json);
        const audioUris = await writePreviewAudioFiles(shareable);
        setData(shareableToViewData(shareable, audioUris));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load song preview');
      }
    }

    if (path) {
      void load();
    }
  }, [path]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.destructive }}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading preview...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 20 }}>
      <SongSheetView data={data} />
    </ScrollView>
  );
}
