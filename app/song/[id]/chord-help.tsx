import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChordDiagram } from '@/components/chord-diagram';
import { ChordDiagramCard } from '@/components/chord-diagram-card';
import { CustomChordEditorModal } from '@/components/custom-chord-editor-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useCustomChords } from '@/hooks/use-custom-chords';
import { useSong } from '@/hooks/use-song';
import { resolveChordShape } from '@/utils/chord-shapes';
import type { CustomChord } from '@/types/chord';

export default function ChordHelpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = useSong(id);
  const { chords: customChords, deleteChord } = useCustomChords();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingChord, setEditingChord] = useState<CustomChord | undefined>(undefined);
  const [creatingName, setCreatingName] = useState<string | undefined>(undefined);

  const songChordNames = useMemo(() => Array.from(new Set(
    song?.sections.flatMap((section) =>
      section.lines.flatMap((line) => line.chordAnnotations.map((annotation) => annotation.chord))
    ) ?? []
  )).sort((left, right) => left.localeCompare(right)), [song]);

  const knownSongChords = songChordNames.filter((name) => !!resolveChordShape(name, customChords));
  const unknownSongChords = songChordNames.filter((name) => !resolveChordShape(name, customChords));

  function openCreateModal(initialName?: string) {
    setEditingChord(undefined);
    setCreatingName(initialName);
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setCreatingName(undefined);
  }

  function handleDeleteChord(chord: CustomChord) {
    Alert.alert(
      'Delete Custom Chord',
      `Delete "${chord.name}"? Existing lyric annotations will remain, but the diagram will disappear.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteChord(chord.id);
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 24 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
          Chord Reference
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Built-in and custom diagrams used across your songs.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
          Song Chords
        </Text>
        {knownSongChords.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {knownSongChords.map((name) => (
              <ChordDiagramCard
                key={name}
                chord={name}
                shape={resolveChordShape(name, customChords)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              No chord diagrams yet
            </Text>
            <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              Add chords from a lyric line with the music-note button or the line options menu.
            </Text>
          </View>
        )}

        {unknownSongChords.length > 0 && (
          <View style={{ gap: 10 }}>
            {unknownSongChords.map((name) => (
              <View
                key={name}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
                    {name}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: Colors.textSecondary }}>
                    No diagram exists yet.
                  </Text>
                </View>
                <Pressable
                  onPress={() => openCreateModal(name)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: Colors.accent,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accentForeground }}>
                    Create
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            Custom Chords
          </Text>
          <Pressable
            onPress={() => openCreateModal()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: Colors.accent,
            }}
          >
            <IconSymbol name="plus" size={14} color={Colors.accentForeground} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accentForeground }}>
              Create Custom Chord
            </Text>
          </Pressable>
        </View>

        {customChords.length > 0 ? (
          <View style={{ gap: 12 }}>
            {customChords.map((chord) => (
              <View
                key={chord.id}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
                    {chord.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => setEditingChord(chord)} hitSlop={8} style={{ padding: 4 }}>
                      <IconSymbol name="pencil" size={16} color={Colors.icon} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteChord(chord)} hitSlop={8} style={{ padding: 4 }}>
                      <IconSymbol name="trash" size={16} color={Colors.destructive} />
                    </Pressable>
                  </View>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <ChordDiagram chordName={chord.name} shape={chord.shape} width={150} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>
              No custom chords yet
            </Text>
            <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
              Create alternate voicings and uncommon shapes here, then reuse them in any song.
            </Text>
          </View>
        )}
      </View>

      <CustomChordEditorModal
        visible={createModalOpen}
        initialName={creatingName}
        onDone={closeCreateModal}
        onCancel={closeCreateModal}
      />

      <CustomChordEditorModal
        visible={!!editingChord}
        initial={editingChord}
        onDone={() => setEditingChord(undefined)}
        onCancel={() => setEditingChord(undefined)}
      />
    </ScrollView>
  );
}
