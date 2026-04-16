import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createAlbum } from '@/db/albums';
import { uuid } from '@/utils/uuid';
import { Colors } from '@/constants/theme';

export default function NewAlbumScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    const now = Date.now();
    const id = uuid();
    await createAlbum({ id, title: title.trim(), artwork: null, createdAt: now });
    router.dismiss();
    router.push(`/albums/${id}`);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 20 }}
      style={{ backgroundColor: Colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Album Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Untitled Album"
          placeholderTextColor={Colors.textTertiary}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
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

      <Pressable
        onPress={handleCreate}
        disabled={saving || !title.trim()}
        style={({ pressed }) => ({
          backgroundColor: Colors.accent,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
          opacity: pressed || saving || !title.trim() ? 0.5 : 1,
          marginTop: 8,
        })}
      >
        <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 16 }}>
          {saving ? 'Creating…' : 'Create Album'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
