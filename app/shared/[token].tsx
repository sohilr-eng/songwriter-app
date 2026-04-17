import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSupabaseClient } from '@/lib/supabase/client';
import { fetchSharedSong, type SharedSongData } from '@/lib/supabase/public-links';
import { parseChords } from '@/utils/chord-parser';
import { formatDate } from '@/utils/format';
import { SongSheetView } from '@/components/song-sheet-view';
import type { SongViewData } from '@/types/share';

function sharedSongToViewData(song: SharedSongData): SongViewData {
  return {
    title: song.title,
    author: song.ownerDisplayName,
    key: song.songKey,
    bpm: song.bpm,
    chordDisplayMode: song.chordDisplayMode,
    customChords: song.customChords,
    sections: song.sections.map((sec) => ({
      id: sec.id,
      label: sec.label,
      sectionOrder: sec.sectionOrder,
      audioKey: null,
      audioUri: null,
      sectionRecordingDuration: null,
      lines: sec.lines.map((line) => ({
        id: line.id,
        text: line.text,
        memo: line.memo,
        chordAnnotations: parseChords(line.chords),
        audioKey: null,
        audioUri: null,
        lineRecordingDuration: null,
      })),
    })),
  };
}

export default function SharedSongScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [song, setSong] = useState<SharedSongData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Cloud service unavailable on this device.');
      setLoading(false);
      return;
    }

    fetchSharedSong(supabase, token)
      .then((data) => {
        if (!data) {
          setError('This link is no longer active or does not exist.');
        } else {
          setSong(data);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load the shared song.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="chevron.left" size={22} color={Colors.accent} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }} numberOfLines={1}>
            {loading ? 'Loading...' : (song?.title ?? 'Shared Song')}
          </Text>
          {song && (
            <Text style={{ fontSize: 12, color: Colors.textSecondary }} numberOfLines={1}>
              {[
                song.ownerDisplayName ? `by ${song.ownerDisplayName}` : null,
                `updated ${formatDate(new Date(song.updatedAt).getTime())}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </View>

        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: Colors.accentSubtle,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.accent }}>
            Read Only
          </Text>
        </View>
      </View>

      {loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Loading song...</Text>
        </View>
      )}

      {!loading && error && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}>
            Could not open song
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      )}

      {!loading && song && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <SongSheetView data={sharedSongToViewData(song)} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
