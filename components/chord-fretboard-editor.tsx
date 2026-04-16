import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { ChordShape } from '@/utils/chord-shapes';

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'] as const;
const ROWS = [0, 1, 2, 3, 4];

interface ChordFretboardEditorProps {
  shape: ChordShape;
  onChange: (shape: ChordShape) => void;
}

function normalizeShape(shape: ChordShape): ChordShape {
  return {
    frets: shape.frets.length === 6 ? shape.frets : [-1, -1, -1, -1, -1, -1],
    baseFret: shape.baseFret ?? 1,
    fingers: shape.fingers,
    barre: shape.barre,
  };
}

export function ChordFretboardEditor({ shape, onChange }: ChordFretboardEditorProps) {
  const normalized = normalizeShape(shape);
  const baseFret = normalized.baseFret ?? 1;

  function update(next: ChordShape) {
    onChange({
      ...next,
      fingers: undefined,
      barre: undefined,
    });
  }

  function toggleStringState(index: number) {
    const current = normalized.frets[index];
    const nextFrets = [...normalized.frets];
    nextFrets[index] = current === -1 ? 0 : -1;
    update({ ...normalized, frets: nextFrets });
  }

  function toggleCell(index: number, row: number) {
    const absoluteFret = baseFret + row;
    const nextFrets = [...normalized.frets];
    nextFrets[index] = normalized.frets[index] === absoluteFret ? -1 : absoluteFret;
    update({ ...normalized, frets: nextFrets });
  }

  function shiftBaseFret(delta: number) {
    const nextBaseFret = Math.max(1, baseFret + delta);
    if (nextBaseFret === baseFret) return;

    const offset = nextBaseFret - baseFret;
    const nextFrets = normalized.frets.map((fret) => (fret > 0 ? Math.max(1, fret + offset) : fret));
    update({
      ...normalized,
      baseFret: nextBaseFret,
      frets: nextFrets,
    });
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        {STRING_LABELS.map((label, index) => {
          const fret = normalized.frets[index];
          const stateLabel = fret === 0 ? 'O' : fret === -1 ? 'X' : `${fret}`;

          return (
            <Pressable
              key={label}
              onPress={() => toggleStringState(index)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: Colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary }}>
                {label}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
                {stateLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        {ROWS.map((row) => (
          <View key={row} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                width: 28,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: '700',
                color: Colors.textSecondary,
              }}
            >
              {baseFret + row}
            </Text>
            {STRING_LABELS.map((label, index) => {
              const active = normalized.frets[index] === baseFret + row;
              return (
                <Pressable
                  key={`${label}-${row}`}
                  onPress={() => toggleCell(index, row)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: active ? Colors.accent : Colors.border,
                    backgroundColor: active ? Colors.accent : Colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: active ? Colors.accentForeground : Colors.borderSubtle,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: Colors.surfaceSubtle,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 6,
        }}
      >
        <Pressable
          onPress={() => shiftBaseFret(-1)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: Colors.surface,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>-</Text>
        </Pressable>

        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
          Base Fret {baseFret}
        </Text>

        <Pressable
          onPress={() => shiftBaseFret(1)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: Colors.surface,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
