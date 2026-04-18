import { Pressable, ScrollView, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

const WHITE_W = 44;
const WHITE_H = 130;
const BLACK_W = 28;
const BLACK_H = 80;

// All notes across 2 octaves (C3–B4)
const ALL_NOTES = [
  'C3','Db3','D3','Eb3','E3','F3','Gb3','G3','Ab3','A3','Bb3','B3',
  'C4','Db4','D4','Eb4','E4','F4','Gb4','G4','Ab4','A4','Bb4','B4',
];

// White note names within an octave and their white-key index (0–6)
const WHITE_NOTES = ['C','D','E','F','G','A','B'];
// Black key inserted after white indices 0(C),1(D),3(F),4(G),5(A)
const BLACK_AFTER_WHITE = new Set([0, 1, 3, 4, 5]);

function isBlack(noteId: string) {
  return noteId.includes('b') || noteId.includes('#');
}

interface OctaveKey {
  noteId: string;
  whiteIndex: number; // index within octave's white keys (0–6), -1 for black
  blackAfter: number; // for black keys: the white index they follow
}

function buildOctaveKeys(octave: number): OctaveKey[] {
  const notes = ALL_NOTES.filter((n) => n.endsWith(String(octave)));
  const keys: OctaveKey[] = [];
  let whiteIdx = 0;

  for (const noteId of notes) {
    if (isBlack(noteId)) {
      keys.push({ noteId, whiteIndex: -1, blackAfter: whiteIdx - 1 });
    } else {
      keys.push({ noteId, whiteIndex: whiteIdx, blackAfter: -1 });
      whiteIdx++;
    }
  }
  return keys;
}

const OCT3_KEYS = buildOctaveKeys(3);
const OCT4_KEYS = buildOctaveKeys(4);

interface PianoKeyboardProps {
  octaveMode: 'one' | 'two';
  onKeyPress: (noteId: string) => void;
  activeNoteId: string | null;
}

export function PianoKeyboard({ octaveMode, onKeyPress, activeNoteId }: PianoKeyboardProps) {
  const octaves = octaveMode === 'two' ? [OCT3_KEYS, OCT4_KEYS] : [OCT4_KEYS];
  const numOctaves = octaves.length;
  const totalWidth = numOctaves * WHITE_NOTES.length * WHITE_W;

  return (
    <ScrollView
      horizontal
      scrollEnabled={octaveMode === 'two'}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      <View style={{ width: totalWidth, height: WHITE_H, position: 'relative' }}>
        {/* White keys */}
        {octaves.map((octaveKeys, octaveIdx) =>
          octaveKeys
            .filter((k) => !isBlack(k.noteId))
            .map((key) => {
              const left = octaveIdx * WHITE_NOTES.length * WHITE_W + key.whiteIndex * WHITE_W;
              const isActive = activeNoteId === key.noteId;
              return (
                <Pressable
                  key={key.noteId}
                  onPress={() => onKeyPress(key.noteId)}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    left,
                    top: 0,
                    width: WHITE_W - 1,
                    height: WHITE_H,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    backgroundColor: isActive
                      ? Colors.chordColor
                      : pressed
                        ? Colors.accentSubtle
                        : Colors.surface,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: 6,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: isActive ? Colors.surface : Colors.textSecondary,
                    }}
                  >
                    {WHITE_NOTES[key.whiteIndex]}
                  </Text>
                </Pressable>
              );
            })
        )}

        {/* Black keys — overlaid absolutely */}
        {octaves.map((octaveKeys, octaveIdx) =>
          octaveKeys
            .filter((k) => isBlack(k.noteId))
            .map((key) => {
              const octaveOffsetX = octaveIdx * WHITE_NOTES.length * WHITE_W;
              const left = octaveOffsetX + (key.blackAfter + 0.65) * WHITE_W - BLACK_W / 2;
              const isActive = activeNoteId === key.noteId;
              const noteName = key.noteId.replace(/[0-9]/g, '');
              return (
                <Pressable
                  key={key.noteId}
                  onPress={() => onKeyPress(key.noteId)}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    left,
                    top: 0,
                    width: BLACK_W,
                    height: BLACK_H,
                    borderRadius: 4,
                    backgroundColor: isActive
                      ? Colors.chordColor
                      : pressed
                        ? '#444'
                        : Colors.accent,
                    zIndex: 2,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: 4,
                  })}
                >
                  {isActive && (
                    <Text style={{ fontSize: 8, fontWeight: '700', color: Colors.surface }}>
                      {noteName}
                    </Text>
                  )}
                </Pressable>
              );
            })
        )}
      </View>
    </ScrollView>
  );
}
