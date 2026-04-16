import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createSong } from '@/db/songs';
import { uuid } from '@/utils/uuid';
import { Colors } from '@/constants/theme';
import type { SongKey } from '@/types/song';

const KEYS: SongKey[] = [
  'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
  'Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','Am','Bbm','Bm',
];

export default function NewSongScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [key, setKey] = useState<SongKey | null>(null);
  const [bpm, setBpm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a song title.');
      return;
    }
    setSaving(true);
    const id = uuid();
    await createSong({
      id,
      title: title.trim(),
      key: key ?? null,
      bpm: bpm ? parseInt(bpm, 10) : null,
      tags: null,
      coverUri: null,
      createdBy: null,
      chordDisplayMode: 'both',
    });
    router.dismiss();
    router.push(`/song/${id}`);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 20 }}
      style={{ backgroundColor: Colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Untitled Song"
          placeholderTextColor={Colors.textTertiary}
          autoFocus
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
          Key (optional)
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
          BPM (optional)
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

      {/* Create button */}
      <Pressable
        onPress={handleCreate}
        disabled={saving}
        style={({ pressed }) => ({
          backgroundColor: Colors.accent,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed || saving ? 0.7 : 1,
          marginTop: 8,
        })}
      >
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 16 }}>
          {saving ? 'Creating…' : 'Create Song'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
