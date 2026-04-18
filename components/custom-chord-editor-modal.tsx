import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useCustomChords } from '@/hooks/use-custom-chords';
import { uuid } from '@/utils/uuid';
import { isBuiltInChord } from '@/utils/chord-shapes';
import { recognizeChord } from '@/utils/chord-recognition';
import { ChordFretboardEditor } from './chord-fretboard-editor';
import type { CustomChord } from '@/types/chord';
import type { ChordShape } from '@/utils/chord-shapes';

interface CustomChordEditorModalProps {
  visible: boolean;
  initial?: CustomChord;
  initialName?: string;
  onDone: () => void;
  onCancel: () => void;
}

const EMPTY_SHAPE: ChordShape = {
  frets: [-1, -1, -1, -1, -1, -1],
  baseFret: 1,
};

function getInitialShape(initial?: CustomChord): ChordShape {
  if (!initial) return EMPTY_SHAPE;
  return {
    frets: [...initial.shape.frets],
    fingers: initial.shape.fingers ? [...initial.shape.fingers] : undefined,
    barre: initial.shape.barre,
    baseFret: initial.shape.baseFret ?? 1,
  };
}

export function CustomChordEditorModal({
  visible,
  initial,
  initialName,
  onDone,
  onCancel,
}: CustomChordEditorModalProps) {
  const insets = useSafeAreaInsets();
  const { chords, createChord, updateChord } = useCustomChords();
  const [name, setName] = useState('');
  const [shape, setShape] = useState<ChordShape>(EMPTY_SHAPE);
  const [nameAutoFilled, setNameAutoFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? initialName ?? '');
    setShape(getInitialShape(initial));
    setNameAutoFilled(false);
    setError(null);
    setSaving(false);
  }, [visible, initial, initialName]);

  function handleNameChange(text: string) {
    setName(text);
    setNameAutoFilled(false);
  }

  function handleShapeChange(next: ChordShape) {
    setShape(next);
    if (initial) return;
    const editable = name === '' || nameAutoFilled;
    if (!editable) return;
    const detected = recognizeChord(next);
    if (detected !== null) {
      setName(detected);
      setNameAutoFilled(true);
    } else if (nameAutoFilled) {
      setName('');
      setNameAutoFilled(false);
    }
  }

  const normalizedNames = useMemo(
    () => chords.map((chord) => chord.name.toLowerCase()),
    [chords]
  );

  async function handleSave() {
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Chord name is required');
      return;
    }

    if (!initial && isBuiltInChord(trimmed)) {
      setError(`Already a built-in chord - try "${trimmed} alt"`);
      return;
    }

    if (!initial && normalizedNames.includes(trimmed.toLowerCase())) {
      setError(`A custom chord named "${trimmed}" already exists`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (initial) {
        await updateChord(initial.id, { shape });
      } else {
        await createChord({
          id: uuid(),
          name: trimmed,
          shape,
        });
      }

      onDone();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Could not save custom chord';
      if (/unique/i.test(message)) {
        setError(`A custom chord named "${trimmed}" already exists`);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(17, 24, 39, 0.35)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View
                style={{
                  height: '94%',
                  backgroundColor: Colors.background,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingHorizontal: 20,
                  paddingTop: 18,
                  paddingBottom: Math.max(insets.bottom, 12) + 20,
                }}
              >
                <View style={{ flex: 1, gap: 18 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
                      {initial ? 'Edit Chord' : 'New Chord'}
                    </Text>
                    <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
                      Build a reusable diagram for alternate voicings and uncommon shapes.
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>
                      Chord Name
                    </Text>
                    <TextInput
                      value={name}
                      onChangeText={handleNameChange}
                      editable={!initial}
                      placeholder="e.g. Mystery, G alt"
                      placeholderTextColor={Colors.textTertiary}
                      autoCapitalize="words"
                      style={{
                        backgroundColor: Colors.surface,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 16,
                        color: initial ? Colors.textSecondary : Colors.textPrimary,
                        borderWidth: 1,
                        borderColor: Colors.border,
                      }}
                    />
                    {nameAutoFilled && name !== '' && (
                      <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                        Auto-detected — tap to edit
                      </Text>
                    )}
                    {error && (
                      <Text style={{ fontSize: 13, lineHeight: 18, color: Colors.destructive }}>
                        {error}
                      </Text>
                    )}
                  </View>

                  <ChordFretboardEditor shape={shape} onChange={handleShapeChange} />

                  <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={onCancel}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: Colors.accentSubtle,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textSecondary }}>
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => void handleSave()}
                      disabled={saving}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: Colors.accent,
                        alignItems: 'center',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.accentForeground }}>
                        {saving ? 'Saving...' : 'Save Chord'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
