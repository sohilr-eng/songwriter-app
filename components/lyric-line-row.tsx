import { useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, Alert } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { IconSymbol } from './ui/icon-symbol';
import { ChordDisplay } from './chord-display';
import { ChordEditor } from './chord-editor';
import { LineRecordingButton } from './line-recording-button';
import { updateLine } from '@/db/lines';
import { serializeChords } from '@/utils/chord-parser';
import type { LyricLine, ChordAnnotation } from '@/types/song';

const LYRIC_FONT_SIZE = 17;
const CHORD_ROW_HEIGHT = 26;

interface LyricLineRowProps {
  line: LyricLine;
  songId: string;
  onDelete: () => void;
  onDrag: () => void;
  isActive: boolean;
}

export function LyricLineRow({ line, songId, onDelete, onDrag, isActive }: LyricLineRowProps) {
  const [text, setText] = useState(line.text);
  const [memo, setMemo] = useState(line.memo ?? '');
  const [memoOpen, setMemoOpen] = useState(!!line.memo);
  const [chordEditMode, setChordEditMode] = useState(false);
  const [annotations, setAnnotations] = useState<ChordAnnotation[]>(line.chordAnnotations);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charWidth = useRef<number>(0);

  function scheduleTextSave(val: string) {
    setText(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateLine(line.id, songId, { text: val });
    }, 350);
  }

  function scheduleMemoSave(val: string) {
    setMemo(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateLine(line.id, songId, { memo: val || null });
    }, 350);
  }

  async function handleSaveChords(updated: ChordAnnotation[]) {
    setAnnotations(updated);
    setChordEditMode(false);
    await updateLine(line.id, songId, { chords: serializeChords(updated) });
  }

  function handleLongPress() {
    Alert.alert('Line Options', undefined, [
      {
        text: 'Edit Chords',
        onPress: () => setChordEditMode(true),
      },
      {
        text: memo || memoOpen ? 'Edit Note' : 'Add Note',
        onPress: () => setMemoOpen(true),
      },
      {
        text: 'Delete Line',
        style: 'destructive',
        onPress: onDelete,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const hasChords = annotations.length > 0;
  const showChordRow = hasChords || chordEditMode;

  return (
    <View
      style={{
        backgroundColor: isActive ? Colors.surfaceSubtle : Colors.surface,
        borderRadius: 10,
        overflow: 'visible',
      }}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={{ paddingHorizontal: 12, paddingTop: showChordRow ? 4 : 0 }}
      >
        {/* ── Chord row ───────────────────────────────────────────── */}
        {chordEditMode ? (
          <View style={{ paddingVertical: 4 }}>
            <ChordEditor
              text={text}
              annotations={annotations}
              charWidth={charWidth.current || 10}
              onSave={handleSaveChords}
              onClose={() => setChordEditMode(false)}
            />
          </View>
        ) : showChordRow ? (
          <View style={{ height: CHORD_ROW_HEIGHT, position: 'relative' }}>
            {annotations.map(ann => (
              <ChordDisplay
                key={ann.charOffset}
                chord={ann.chord}
                left={ann.charOffset * (charWidth.current || 10)}
                onLongPress={() => setChordEditMode(true)}
              />
            ))}
          </View>
        ) : null}

        {/* ── Lyric input row ─────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={text}
            onChangeText={scheduleTextSave}
            placeholder="Write a line…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            style={{
              flex: 1,
              fontSize: LYRIC_FONT_SIZE,
              lineHeight: 26,
              color: Colors.textPrimary,
              paddingVertical: 10,
              fontFamily: Fonts?.ios?.mono ?? undefined,
            }}
          />

          {/* Per-line voice memo */}
          <LineRecordingButton
            lineId={line.id}
            existingUri={line.lineRecordingUri}
            existingDuration={line.lineRecordingDuration}
            onSave={async (uri, duration) => {
              await updateLine(line.id, songId, {
                lineRecordingUri: uri,
                lineRecordingDuration: duration,
              });
            }}
            onDelete={async () => {
              await updateLine(line.id, songId, {
                lineRecordingUri: null,
                lineRecordingDuration: null,
              });
            }}
          />

          {/* Drag handle */}
          <Pressable
            onLongPress={onDrag}
            delayLongPress={100}
            hitSlop={8}
            style={{ padding: 8 }}
          >
            <IconSymbol name="arrow.up.arrow.down" size={15} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </Pressable>

      {/* ── Memo row ──────────────────────────────────────────────── */}
      {memoOpen && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: Colors.borderSubtle,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 13, color: Colors.textTertiary, paddingTop: 5 }}>✎</Text>
          <TextInput
            value={memo}
            onChangeText={scheduleMemoSave}
            placeholder="Add a note to this line…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            autoFocus={!memo}
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 20,
              color: Colors.textSecondary,
              paddingVertical: 4,
            }}
          />
          {!memo && (
            <Pressable onPress={() => setMemoOpen(false)} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      {/* ── Hidden character for measuring monospace width ────────── */}
      <Text
        style={{
          position: 'absolute',
          opacity: 0,
          fontSize: LYRIC_FONT_SIZE,
          fontFamily: Fonts?.ios?.mono ?? undefined,
          pointerEvents: 'none',
        }}
        onLayout={e => { charWidth.current = e.nativeEvent.layout.width; }}
      >
        {'W'}
      </Text>
    </View>
  );
}
