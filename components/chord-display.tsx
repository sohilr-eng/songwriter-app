import { useState } from 'react';
import { Pressable, Text, Modal, View, TouchableWithoutFeedback } from 'react-native';
import { ChordDiagram, DIAGRAM_WIDTH } from './chord-diagram';
import { getChordShape } from '@/utils/chord-shapes';
import { Colors } from '@/constants/theme';
import { useChordDisplay } from '@/contexts/chord-display-context';

interface ChordDisplayProps {
  chord: string;
  /** Pixel offset from the left edge of the lyric container */
  left: number;
  onLongPress?: () => void;
}

export function ChordDisplay({ chord, left, onLongPress }: ChordDisplayProps) {
  const [diagramVisible, setDiagramVisible] = useState(false);
  const hasShape = !!getChordShape(chord);
  const mode = useChordDisplay();

  function renderInlineContent() {
    if (mode === 'diagram' && hasShape) {
      return <ChordDiagram chordName={chord} width={54} showLabel={false} />;
    }

    if (mode === 'both' && hasShape) {
      return (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: Colors.chordColor,
              letterSpacing: 0.2,
            }}
          >
            {chord}
          </Text>
          <ChordDiagram chordName={chord} width={56} showLabel={false} />
        </View>
      );
    }

    return (
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: Colors.chordColor,
          letterSpacing: 0.2,
        }}
      >
        {chord}
      </Text>
    );
  }

  return (
    <>
      <Pressable
        onPress={hasShape ? () => setDiagramVisible(true) : undefined}
        onLongPress={onLongPress}
        delayLongPress={300}
        style={{
          position: 'absolute',
          left,
          top: 2,
          alignItems: 'center',
        }}
        hitSlop={4}
      >
        {renderInlineContent()}
      </Pressable>

      {/* Chord diagram modal */}
      <Modal
        visible={diagramVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDiagramVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDiagramVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(17, 24, 39, 0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 20,
                  padding: 24,
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(17, 24, 39, 0.18)',
                  width: DIAGRAM_WIDTH + 48,
                }}
              >
                <ChordDiagram chordName={chord} />
                {!hasShape && (
                  <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: 8 }}>
                    No diagram available
                  </Text>
                )}
                <Pressable
                  onPress={() => setDiagramVisible(false)}
                  style={{
                    marginTop: 16,
                    paddingHorizontal: 28,
                    paddingVertical: 10,
                    backgroundColor: Colors.accentSubtle,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: Colors.accent, fontWeight: '600', fontSize: 15 }}>
                    Done
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
