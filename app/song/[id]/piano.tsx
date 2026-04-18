import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PianoKeyboard } from '@/components/piano-keyboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { usePianoAudio } from '@/hooks/use-piano-audio';

export default function PianoScreen() {
  const insets = useSafeAreaInsets();
  const [octaveMode, setOctaveMode] = useState<'one' | 'two'>('two');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const { playNote } = usePianoAudio();

  function handleKeyPress(noteId: string) {
    setActiveNoteId(noteId);
    playNote(noteId);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
          Piano
        </Text>
        <Pressable
          onPress={() => setOctaveMode((m) => (m === 'one' ? 'two' : 'one'))}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: Colors.accentSubtle,
          }}
        >
          <IconSymbol name="lock" size={13} color={Colors.textSecondary} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary }}>
            {octaveMode === 'one' ? '1 Oct' : '2 Oct'}
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          fontSize: 34,
          fontWeight: '800',
          color: Colors.accent,
          textAlign: 'center',
          minHeight: 46,
          paddingVertical: 4,
        }}
      >
        {activeNoteId ?? ' '}
      </Text>

      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: insets.bottom + 12 }}>
        <PianoKeyboard
          octaveMode={octaveMode}
          onKeyPress={handleKeyPress}
          activeNoteId={activeNoteId}
        />
      </View>
    </View>
  );
}
