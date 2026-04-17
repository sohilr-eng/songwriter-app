import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '@/constants/theme';
import { importSong } from '@/utils/import-song';
import { decodeSong } from '@/utils/share-codec';
import type { ShareableSong } from '@/types/share';

export default function ImportSongScreen() {
  const { path } = useLocalSearchParams<{ path: string }>();
  const router = useRouter();
  const [shareable, setShareable] = useState<ShareableSong | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const json = await FileSystem.readAsStringAsync(path);
        setShareable(decodeSong(json));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load shared song');
      }
    }

    if (path) {
      void load();
    }
  }, [path]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20, justifyContent: 'center', flexGrow: 1 }}
    >
      {error ? (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.destructive }}>
            {error}
          </Text>
        </View>
      ) : !shareable ? (
        <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>Loading shared song...</Text>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.textPrimary }}>
              {shareable.song.title}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              {[shareable.author ? `shared by ${shareable.author}` : null, shareable.song.key, shareable.song.bpm ? `${shareable.song.bpm} BPM` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
              {shareable.sections.length} sections · {shareable.lines.length} lines
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => router.push({ pathname: '/song-preview', params: { path } })}
              style={{
                backgroundColor: Colors.accentSubtle,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                Preview
              </Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={async () => {
                setSaving(true);
                const songId = await importSong(shareable);
                router.dismissAll();
                router.push(`/song/${songId}`);
              }}
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.accentForeground }}>
                {saving ? 'Saving...' : 'Save a Copy'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}
