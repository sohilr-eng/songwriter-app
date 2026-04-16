import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSongById, updateSong, deleteSong } from '@/db/songs';
import { pickCover, deleteCover } from '@/utils/pick-cover';
import { CoverImage } from '@/components/cover-image';
import { Colors } from '@/constants/theme';
import type { SongRow, SongKey } from '@/types/song';

const KEYS: SongKey[] = [
  'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
  'Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','Am','Bbm','Bm',
];

export default function SongSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [song, setSong] = useState<SongRow | null>(null);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState<SongKey | null>(null);
  const [bpm, setBpm] = useState('');

  useEffect(() => {
    getSongById(id).then(s => {
      if (!s) return;
      setSong(s);
      setTitle(s.title);
      setKey(s.key);
      setBpm(s.bpm ? String(s.bpm) : '');
    });
  }, [id]);

  async function handleSave() {
    await updateSong(id, {
      title: title.trim() || song!.title,
      key: key ?? null,
      bpm: bpm ? parseInt(bpm, 10) : null,
    });
    router.dismiss();
  }

  async function handleChangeCover() {
    const uri = await pickCover(id);
    if (uri) {
      await updateSong(id, { coverUri: uri });
      setSong(prev => prev ? { ...prev, coverUri: uri } : prev);
    }
  }

  async function handleRemoveCover() {
    await deleteCover(id);
    await updateSong(id, { coverUri: null });
    setSong(prev => prev ? { ...prev, coverUri: null } : prev);
  }

  async function handleDelete() {
    Alert.alert('Delete Song', `Delete "${song?.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteSong(id);
          router.dismissAll();
        },
      },
    ]);
  }

  if (!song) return null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 24 }}
      style={{ backgroundColor: Colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cover image */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <CoverImage uri={song.coverUri} size={100} onPress={handleChangeCover} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleChangeCover}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.accentSubtle, borderRadius: 10 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.accentSubtleForeground }}>
              Change Cover
            </Text>
          </Pressable>
          {song.coverUri && (
            <Pressable
              onPress={handleRemoveCover}
              style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.accentSubtle, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.destructive }}>
                Remove
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Title */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: Colors.textPrimary,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />
      </View>

      {/* Key */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Key
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
            {KEYS.map(k => (
              <Pressable
                key={k}
                onPress={() => setKey(key === k ? null : k)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: key === k ? Colors.accent : Colors.surface,
                  borderWidth: 1,
                  borderColor: key === k ? Colors.accent : Colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: key === k ? Colors.accentForeground : Colors.textPrimary }}>
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* BPM */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          BPM
        </Text>
        <TextInput
          value={bpm}
          onChangeText={t => setBpm(t.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 120"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: Colors.textPrimary,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />
      </View>

      {/* Save */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => ({
          backgroundColor: Colors.accent,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 16 }}>
          Save Changes
        </Text>
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => ({
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: Colors.destructive, fontWeight: '600', fontSize: 15 }}>
          Delete Song
        </Text>
      </Pressable>
    </ScrollView>
  );
}
