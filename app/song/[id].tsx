import { useState, useCallback } from 'react';
import { Alert, View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sharing from 'expo-sharing';
import { useSong } from '@/hooks/use-song';
import { SectionBlock } from '@/components/section-block';
import { UndoBar } from '@/components/undo-bar';
import { CoverImage } from '@/components/cover-image';
import { SegmentedControl } from '@/components/segmented-control';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ChordDisplayProvider } from '@/contexts/chord-display-context';
import { Colors } from '@/constants/theme';
import { useCustomChords } from '@/hooks/use-custom-chords';
import { useDisplayName } from '@/hooks/use-settings';
import { repositories } from '@/repositories';
import { computeOrder } from '@/utils/reorder';
import { buildSharePayload, readAudioForSong, writeShareFile } from '@/utils/share-codec';
import { uuid } from '@/utils/uuid';
import type { ChordDisplayMode, Section } from '@/types/song';

const CHORD_DISPLAY_OPTIONS: { label: string; value: ChordDisplayMode }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Chart', value: 'diagram' },
  { label: 'Both', value: 'both' },
];

export default function SongEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const song = useSong(id);
  const { chords: customChords } = useCustomChords();
  const { displayName } = useDisplayName();

  const [undoVisible, setUndoVisible] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [undoFn, setUndoFn] = useState<(() => Promise<void>) | null>(null);

  const showUndo = useCallback((message: string, fn: () => Promise<void>) => {
    setUndoMessage(message);
    setUndoFn(() => fn);
    setUndoVisible(true);
  }, []);

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
    await repositories.songs.createSection(section);
  }

  async function handleReorderSections(newData: Section[]) {
    await repositories.songs.reorderSections(id, computeOrder(newData));
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

  async function handleShare(includeAudio: boolean) {
    if (!song) return;

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Sharing unavailable', 'Native file sharing is not available on this device.');
      return;
    }

    const usedNames = new Set(
      song.sections.flatMap((section) =>
        section.lines.flatMap((line) => line.chordAnnotations.map((annotation) => annotation.chord.toLowerCase()))
      )
    );
    const relevantCustomChords = customChords.filter((chord) => usedNames.has(chord.name.toLowerCase()));
    const audio = await readAudioForSong(song, includeAudio);
    const payload = buildSharePayload(song, relevantCustomChords, displayName || null, audio);
    const path = await writeShareFile(payload, song.title);

    try {
      await Sharing.shareAsync(path, {
        mimeType: 'application/x-songwriter-song',
        dialogTitle: 'Share Song',
      });
    } finally {
      await import('expo-file-system/legacy').then((FileSystem) =>
        FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {})
      );
    }
  }

  function promptShare() {
    Alert.alert('Share Song', 'How do you want to share this song?', [
      {
        text: 'Share as Link',
        onPress: () => router.push(`/song/${id}/share`),
      },
      {
        text: 'Export as File',
        onPress: () => {
          Alert.alert('Export as File', 'Include voice memos in the exported file?', [
            { text: 'Without Audio', onPress: () => { void handleShare(false); } },
            { text: 'Include Audio', onPress: () => { void handleShare(true); } },
            { text: 'Cancel', style: 'cancel' },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
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

          <CoverImage uri={song.coverUri} size={36} />

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }} numberOfLines={1}>
              {song.title}
            </Text>
            {(song.key || song.bpm) && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                {[song.key, song.bpm ? `${song.bpm} BPM` : null].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>

          <Pressable onPress={() => router.push(`/song/${id}/view`)} hitSlop={10} style={{ padding: 6 }}>
            <IconSymbol name="person.2" size={20} color={Colors.icon} />
          </Pressable>

          <Pressable onPress={() => router.push(`/song/${id}/snapshots`)} hitSlop={10} style={{ padding: 6 }}>
            <IconSymbol name="clock.arrow.circlepath" size={20} color={Colors.icon} />
          </Pressable>

          <Pressable onPress={promptShare} hitSlop={10} style={{ padding: 6 }}>
            <IconSymbol name="square.and.arrow.up" size={20} color={Colors.icon} />
          </Pressable>

          <Pressable onPress={() => router.push(`/song/${id}/chord-help`)} hitSlop={10} style={{ padding: 6 }}>
            <IconSymbol name="music.note.list" size={20} color={Colors.icon} />
          </Pressable>

          <Pressable onPress={() => router.push(`/song/${id}/settings`)} hitSlop={10} style={{ padding: 6 }}>
            <IconSymbol name="ellipsis" size={20} color={Colors.icon} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <SegmentedControl
            options={CHORD_DISPLAY_OPTIONS}
            value={song.chordDisplayMode}
            onChange={(mode) => {
              void repositories.songs.update(id, { chordDisplayMode: mode });
            }}
          />
        </View>

        <ChordDisplayProvider mode={song.chordDisplayMode}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <DraggableFlatList
              data={song.sections}
              keyExtractor={(item) => item.id}
              renderItem={renderSection}
              onDragEnd={({ data }) => handleReorderSections(data)}
              scrollEnabled={false}
              containerStyle={{ overflow: 'visible' }}
            />

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
                Add a section to start writing.{'\n'}Verse, Chorus, Bridge - name it anything.
              </Text>
            )}
          </ScrollView>
        </ChordDisplayProvider>

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
