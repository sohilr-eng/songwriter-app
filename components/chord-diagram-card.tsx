import { Pressable, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { ChordDiagram } from './chord-diagram';

interface ChordDiagramCardProps {
  chord: string;
  onPress?: () => void;
}

export function ChordDiagramCard({ chord, onPress }: ChordDiagramCardProps) {
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
      <ChordDiagram chordName={chord} width={118} showLabel={false} />
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
