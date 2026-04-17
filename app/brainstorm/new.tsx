import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { repositories } from '@/repositories';
import { uuid } from '@/utils/uuid';
import { Colors } from '@/constants/theme';

export default function NewIdeaScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    const now = Date.now();
    const id = uuid();
    await repositories.brainstorm.create({
      id,
      title: title.trim() || 'Untitled Idea',
      text: text.trim(),
      recordingUri: null,
      tags: null,
      createdAt: now,
      updatedAt: now,
    });
    router.dismiss();
    router.push(`/brainstorm/${id}`);
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
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Untitled Idea"
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

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Idea
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write your idea, lyric fragment, or concept…"
          placeholderTextColor={Colors.textTertiary}
          multiline
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: Colors.textPrimary,
            borderWidth: 1,
            borderColor: Colors.border,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
        />
      </View>

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
          {saving ? 'Saving…' : 'Save Idea'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
