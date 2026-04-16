import { Pressable, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { ChordDiagram } from './chord-diagram';
import type { ChordShape } from '@/utils/chord-shapes';

interface ChordDiagramCardProps {
  chord: string;
  onPress?: () => void;
  shape?: ChordShape | null;
}

export function ChordDiagramCard({ chord, onPress, shape }: ChordDiagramCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        width: '48%',
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <ChordDiagram chordName={chord} width={118} showLabel={false} shape={shape} />
      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: '700',
          color: Colors.textPrimary,
        }}
      >
        {chord}
      </Text>
    </Pressable>
  );
}
