import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSong } from '@/hooks/use-song';
import { SectionBlock } from '@/components/section-block';
import { UndoBar } from '@/components/undo-bar';
import { CoverImage } from '@/components/cover-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { createSection, reorderSections } from '@/db/sections';
import { computeOrder } from '@/utils/reorder';
import { uuid } from '@/utils/uuid';
import type { Section } from '@/types/song';

export default function SongEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const song = useSong(id);

  // ── Undo bar ────────────────────────────────────────────────────────────
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [undoFn, setUndoFn] = useState<(() => Promise<void>) | null>(null);

  const showUndo = useCallback((message: string, fn: () => Promise<void>) => {
    setUndoMessage(message);
    setUndoFn(() => fn);
    setUndoVisible(true);
  }, []);

  // ── Section management ──────────────────────────────────────────────────
  async function handleAddSection() {
    const section: Section = {
      id: uuid(),
      songId: id,
      label: `Section ${(song?.sections.length ?? 0) + 1}`,
      sectionOrder: song?.sections.length ?? 0,
      sectionRecordingUri: null,
      sectionRecordingDuration: null,
      lines: [],
    };
    await createSection(section);
  }

  async function handleReorderSections(newData: Section[]) {
    await reorderSections(id, computeOrder(newData));
  }

  function renderSection({ item, drag, isActive }: RenderItemParams<Section>) {
    return (
      <ScaleDecorator activeScale={1.01}>
        <SectionBlock
          section={item}
          songId={id}
          onDragSection={drag}
          isActive={isActive}
          onSectionDeleted={(_sectionId, _label) => {}}
          onShowUndo={showUndo}
        />
      </ScaleDecorator>
    );
  }

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
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

          <CoverImage uri={song.coverUri} size={36} />

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }}
              numberOfLines={1}
            >
              {song.title}
            </Text>
            {(song.key || song.bpm) && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                {[song.key, song.bpm ? `${song.bpm} BPM` : null].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>

          {/* Versions */}
          <Pressable
            onPress={() => router.push(`/song/${id}/snapshots`)}
            hitSlop={10}
            style={{ padding: 6 }}
          >
            <IconSymbol name="clock.arrow.circlepath" size={20} color={Colors.icon} />
          </Pressable>

          {/* Settings */}
          <Pressable
            onPress={() => router.push(`/song/${id}/settings`)}
            hitSlop={10}
            style={{ padding: 6 }}
          >
            <IconSymbol name="ellipsis" size={20} color={Colors.icon} />
          </Pressable>
        </View>

        {/* ── Editor body ───────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <DraggableFlatList
            data={song.sections}
            keyExtractor={item => item.id}
            renderItem={renderSection}
            onDragEnd={({ data }) => handleReorderSections(data)}
            scrollEnabled={false}
            containerStyle={{ overflow: 'visible' }}
          />

          {/* Add section */}
          <Pressable
            onPress={handleAddSection}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: Colors.border,
              borderStyle: 'dashed',
              opacity: pressed ? 0.6 : 1,
              marginTop: song.sections.length > 0 ? 4 : 0,
            })}
          >
            <IconSymbol name="plus" size={18} color={Colors.textSecondary} />
            <Text style={{ fontSize: 15, color: Colors.textSecondary, fontWeight: '500' }}>
              Add Section
            </Text>
          </Pressable>

          {song.sections.length === 0 && (
            <Text
              style={{
                textAlign: 'center',
                color: Colors.textTertiary,
                fontSize: 14,
                marginTop: 16,
                lineHeight: 20,
              }}
            >
              Add a section to start writing.{'\n'}Verse, Chorus, Bridge — name it anything.
            </Text>
          )}
        </ScrollView>

        {/* ── Undo bar ─────────────────────────────────────────────────── */}
        <UndoBar
          visible={undoVisible}
          message={undoMessage}
          onUndo={async () => {
            await undoFn?.();
            setUndoVisible(false);
          }}
          onDismiss={() => setUndoVisible(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
