import { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, SafeAreaView, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIdea } from '@/hooks/use-idea';
import { RecordingStrip } from '@/components/recording-strip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { updateIdea, deleteIdea } from '@/db/brainstorm';
import { createSong } from '@/db/songs';
import { createSection } from '@/db/sections';
import { createLine } from '@/db/lines';
import { uuid } from '@/utils/uuid';

const AUTOSAVE_DELAY = 400;

export default function IdeaEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const idea = useIdea(id);

  // Track pending saves to avoid overwriting in-flight edits
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave helpers
  const saveTitle = useCallback((value: string) => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateIdea(id, { title: value.trim() || 'Untitled Idea' });
    }, AUTOSAVE_DELAY);
  }, [id]);

  const saveText = useCallback((value: string) => {
    if (textTimer.current) clearTimeout(textTimer.current);
    textTimer.current = setTimeout(() => {
      updateIdea(id, { text: value });
    }, AUTOSAVE_DELAY);
  }, [id]);

  // Flush timers on unmount
  useEffect(() => {
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current);
      if (textTimer.current)  clearTimeout(textTimer.current);
    };
  }, []);

  async function handleSaveRecording(uri: string, duration: number) {
    await updateIdea(id, { recordingUri: uri });
  }

  async function handleDeleteRecording() {
    await updateIdea(id, { recordingUri: null });
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Idea',
      `Delete "${idea?.title ?? 'this idea'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteIdea(id);
            router.back();
          },
        },
      ]
    );
  }

  async function handlePromoteToSong() {
    if (!idea) return;
    Alert.alert(
      'Promote to Song',
      'Create a new song from this idea? The idea will remain in Brainstorm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Song',
          onPress: async () => {
            const songId = uuid();
            const sectionId = uuid();

            // Create the song
            await createSong({
              id: songId,
              title: idea.title,
              key: null,
              bpm: null,
              tags: null,
              coverUri: null,
              createdBy: null,
              chordDisplayMode: 'both',
            });

            // Split the text into lines, create a single section + lyric lines
            const rawLines = (idea.text ?? '')
              .split('\n')
              .map(l => l.trim())
              .filter(Boolean);

            await createSection({
              id: sectionId,
              songId,
              label: 'Verse',
              sectionOrder: 0,
              sectionRecordingUri: null,
              sectionRecordingDuration: null,
            });

            for (let i = 0; i < rawLines.length; i++) {
              await createLine(
                {
                  id: uuid(),
                  sectionId,
                  lineOrder: i,
                  text: rawLines[i],
                  chords: null,
                  memo: null,
                  lineRecordingUri: null,
                  lineRecordingDuration: null,
                },
                songId
              );
            }

            router.back();
            router.push(`/song/${songId}`);
          },
        },
      ]
    );
  }

  if (!idea) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 10,
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="chevron.left" size={22} color={Colors.accent} />
        </Pressable>

        <TextInput
          defaultValue={idea.title}
          onChangeText={saveTitle}
          placeholder="Untitled Idea"
          placeholderTextColor={Colors.textTertiary}
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: '700',
            color: Colors.textPrimary,
          }}
          returnKeyType="done"
        />

        {/* Promote to Song */}
        <Pressable
          onPress={handlePromoteToSong}
          hitSlop={10}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: Colors.accent,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <IconSymbol name="music.note" size={14} color={Colors.accentForeground} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accentForeground }}>
            Promote
          </Text>
        </Pressable>

        {/* Delete */}
        <Pressable onPress={handleDelete} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="trash" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Idea text */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
          }}
        >
          <TextInput
            defaultValue={idea.text ?? ''}
            onChangeText={saveText}
            placeholder={'Write your idea, lyric fragment, concept…\n\nEach line will become a lyric line when you promote to a song.'}
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
            style={{
              padding: 16,
              fontSize: 16,
              color: Colors.textPrimary,
              lineHeight: 26,
              minHeight: 240,
            }}
          />
        </View>

        {/* Voice memo */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
          }}
        >
          <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Voice Memo
            </Text>
          </View>
          <RecordingStrip
            storageKey={`idea-${id}`}
            existingUri={idea.recordingUri}
            onSave={handleSaveRecording}
            onDelete={handleDeleteRecording}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
