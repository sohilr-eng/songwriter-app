import { useState, useRef } from 'react';
import {
  View, Pressable, TextInput, Text, Modal,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '@/constants/theme';
import type { ChordAnnotation } from '@/types/song';

interface WordPosition {
  word: string;
  charOffset: number;   // character index of word start in the line
  pixelLeft: number;    // pixel offset = charOffset × charWidth
}

interface ChordEditorProps {
  text: string;
  annotations: ChordAnnotation[];
  charWidth: number;
  onSave: (annotations: ChordAnnotation[]) => void;
  onClose: () => void;
}

export function ChordEditor({ text, annotations, charWidth, onSave, onClose }: ChordEditorProps) {
  const [draft, setDraft] = useState<ChordAnnotation[]>([...annotations]);
  const [editing, setEditing] = useState<{ offset: number; value: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Build word positions
  const words: WordPosition[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      charOffset: match.index,
      pixelLeft: match.index * charWidth,
    });
  }

  function handleWordTap(offset: number) {
    const existing = draft.find(a => a.charOffset === offset);
    setEditing({ offset, value: existing?.chord ?? '' });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleConfirm() {
    if (!editing) return;
    const value = editing.value.trim();
    let updated = draft.filter(a => a.charOffset !== editing.offset);
    if (value) {
      updated = [...updated, { chord: value, charOffset: editing.offset }];
      updated.sort((a, b) => a.charOffset - b.charOffset);
    }
    setDraft(updated);
    setEditing(null);
  }

  function handleRemove(offset: number) {
    setDraft(prev => prev.filter(a => a.charOffset !== offset));
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Hit targets for each word */}
      <View style={{ flexDirection: 'row', flexWrap: 'nowrap', position: 'relative', height: 28 }}>
        {words.map(({ word, charOffset, pixelLeft }) => {
          const hasChord = draft.some(a => a.charOffset === charOffset);
          return (
            <Pressable
              key={charOffset}
              onPress={() => handleWordTap(charOffset)}
              style={{
                position: 'absolute',
                left: pixelLeft,
                width: word.length * charWidth,
                height: 28,
                borderRadius: 4,
                backgroundColor: hasChord
                  ? `${Colors.chordColor}22`
                  : `${Colors.border}88`,
                borderWidth: 1,
                borderColor: hasChord ? Colors.chordColor : Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {hasChord && (
                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.chordColor }}>
                  {draft.find(a => a.charOffset === charOffset)?.chord}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Save / Cancel bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable
          onPress={() => onSave(draft)}
          style={{
            flex: 1,
            backgroundColor: Colors.accent,
            paddingVertical: 8,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.accentForeground, fontWeight: '600', fontSize: 14 }}>
            Save Chords
          </Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: Colors.accentSubtle,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
            Cancel
          </Text>
        </Pressable>
      </View>

      {/* Chord input modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <TouchableWithoutFeedback onPress={handleConfirm}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(17, 24, 39, 0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 16,
                  padding: 20,
                  width: 240,
                  gap: 12,
                  boxShadow: '0 4px 24px rgba(17, 24, 39, 0.14)',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {'Chord at "'}
                    {editing != null ? words.find(w => w.charOffset === editing.offset)?.word ?? '' : ''}
                    {'"'}
                  </Text>

                  <TextInput
                    ref={inputRef}
                    value={editing?.value ?? ''}
                    onChangeText={v => setEditing(prev => prev ? { ...prev, value: v } : null)}
                    placeholder="e.g. Am, G, Cadd9"
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                    style={{
                      backgroundColor: Colors.surfaceSubtle,
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 18,
                      fontWeight: '700',
                      color: Colors.chordColor,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={handleConfirm}
                      style={{
                        flex: 1,
                        backgroundColor: Colors.accent,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: Colors.accentForeground, fontWeight: '700' }}>Set</Text>
                    </Pressable>
                    {editing && draft.some(a => a.charOffset === editing.offset) && (
                      <Pressable
                        onPress={() => {
                          if (editing) handleRemove(editing.offset);
                          setEditing(null);
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: Colors.accentSubtle,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: Colors.destructive, fontWeight: '600' }}>Remove</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
