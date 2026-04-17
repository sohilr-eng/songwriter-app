import React from 'react';
import { View, Pressable, Text, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { LyricLineRow } from './lyric-line-row';
import { SectionLabelInput } from './section-label-input';
import { RecordingStrip } from './recording-strip';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { repositories } from '@/repositories';
import { getSectionRecordingStorageKey } from '@/lib/audio/recordings';
import { computeOrder } from '@/utils/reorder';
import { uuid } from '@/utils/uuid';
import type { Section, LyricLine } from '@/types/song';

interface SectionBlockProps {
  section: Section;
  songId: string;
  onDragSection: () => void;
  isActive: boolean;
  onSectionDeleted: (id: string, label: string) => void;
  onShowUndo: (message: string, fn: () => Promise<void>) => void;
}

export function SectionBlock({
  section,
  songId,
  onDragSection,
  isActive,
  onSectionDeleted,
  onShowUndo,
}: SectionBlockProps) {
  async function handleAddLine() {
    const newLine: LyricLine = {
      id: uuid(),
      sectionId: section.id,
      lineOrder: section.lines.length,
      text: '',
      chords: null,
      memo: null,
      lineRecordingUri: null,
      lineRecordingDuration: null,
      chordAnnotations: [],
    };
    await repositories.songs.createLine(newLine, songId);
  }

  async function handleDeleteLine(line: LyricLine) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Store full line data before deleting so we can restore it
    const snapshot = { ...line };
    await repositories.songs.deleteLine(line.id, songId);
    onShowUndo('Line deleted', async () => {
      await repositories.songs.createLine(snapshot, songId);
    });
  }

  async function handleReorderLines(newData: LyricLine[]) {
    await repositories.songs.reorderLines(section.id, songId, computeOrder(newData));
  }

  async function handleDeleteSection() {
    Alert.alert(
      'Delete Section',
      `Delete "${section.label}" and all its lines?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // Capture full section + lines before deleting
            const sectionSnapshot = { ...section };
            const linesSnapshot = section.lines.map(l => ({ ...l }));
            await repositories.songs.deleteSection(section.id, songId);
            onSectionDeleted(section.id, section.label);
            onShowUndo(`"${section.label}" deleted`, async () => {
              await repositories.songs.createSection(sectionSnapshot);
              for (const line of linesSnapshot) {
                await repositories.songs.createLine(line, songId);
              }
            });
          },
        },
      ]
    );
  }

  async function handleRenameSection(label: string) {
    await repositories.songs.updateSection(section.id, songId, { label });
  }

  async function handleSaveRecording(uri: string, duration: number) {
    await repositories.songs.updateSection(section.id, songId, {
      sectionRecordingUri: uri,
      sectionRecordingDuration: duration,
    });
  }

  async function handleDeleteRecording() {
    await repositories.songs.updateSection(section.id, songId, {
      sectionRecordingUri: null,
      sectionRecordingDuration: null,
    });
  }

  function renderLine({ item, drag, isActive: lineActive }: RenderItemParams<LyricLine>) {
    return (
      <ScaleDecorator activeScale={1.01}>
        <View style={{ marginBottom: 2 }}>
          <LyricLineRow
            line={item}
            songId={songId}
            onDrag={drag}
            isActive={lineActive}
            onDelete={() => handleDeleteLine(item)}
          />
        </View>
      </ScaleDecorator>
    );
  }

  return (
    <View
      style={{
        backgroundColor: isActive ? Colors.surfaceSubtle : 'transparent',
        borderRadius: 16,
        marginBottom: 20,
      }}
    >
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 4,
          paddingVertical: 6,
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Pressable
          onLongPress={onDragSection}
          delayLongPress={100}
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <IconSymbol name="arrow.up.arrow.down" size={16} color={Colors.textTertiary} />
        </Pressable>

        <SectionLabelInput value={section.label} onCommit={handleRenameSection} />

        <Pressable onPress={handleDeleteSection} hitSlop={10} style={{ padding: 4 }}>
          <IconSymbol name="trash" size={16} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* Lines card */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <DraggableFlatList
          data={section.lines}
          keyExtractor={item => item.id}
          renderItem={renderLine}
          onDragEnd={({ data }) => handleReorderLines(data)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 12 }} />
          )}
        />

        {/* Add line */}
        <Pressable
          onPress={handleAddLine}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            paddingLeft: 14,
            borderTopWidth: section.lines.length > 0 ? 1 : 0,
            borderTopColor: Colors.borderSubtle,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <IconSymbol name="plus" size={16} color={Colors.textTertiary} />
          <Text style={{ fontSize: 15, color: Colors.textTertiary }}>Add line</Text>
        </Pressable>

        {/* Section voice memo */}
        <RecordingStrip
          storageKey={getSectionRecordingStorageKey(section.id)}
          existingUri={section.sectionRecordingUri}
          onSave={handleSaveRecording}
          onDelete={handleDeleteRecording}
        />
      </View>
    </View>
  );
}
