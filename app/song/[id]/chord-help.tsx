import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChordDiagramCard } from '@/components/chord-diagram-card';
import { Colors } from '@/constants/theme';
import { useSong } from '@/hooks/use-song';
import { getChordShape } from '@/utils/chord-shapes';

export default function ChordHelpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = useSong(id);

  const chords = Array.from(new Set(
    song?.sections.flatMap((section) =>
      section.lines.flatMap((line) => line.chordAnnotations.map((annotation) => annotation.chord))
    ) ?? []
  )).sort((left, right) => left.localeCompare(right));

  const knownChords = chords.filter((chord) => !!getChordShape(chord));
  const unknownChords = chords.filter((chord) => !getChordShape(chord));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
          Chord Reference
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
          Diagrams for the chords used in this song. Tap any inline chord in the editor for a larger view.
        </Text>
      </View>

      {knownChords.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          {knownChords.map((chord) => (
            <ChordDiagramCard key={chord} chord={chord} />
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

      {unknownChords.length > 0 && (
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
            Missing diagrams
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: Colors.textSecondary }}>
            {unknownChords.join(', ')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
