import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChordDiagram } from './chord-diagram';
import { IconSymbol } from './ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useAudioPlayerHook } from '@/hooks/use-audio-player';
import { formatDuration } from '@/utils/format';
import { resolveChordShape } from '@/utils/chord-shapes';
import type { SongViewData, SongViewLine } from '@/types/share';

const CHORD_ROW_HEIGHTS = {
  name: 26,
  diagram: 72,
  both: 92,
} as const;

function AudioBadge({ uri, duration }: { uri: string | null; duration: number | null }) {
  const player = useAudioPlayerHook(uri);

  if (!uri) return null;

  return (
    <Pressable
      onPress={player.togglePlayPause}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: Colors.accentSubtle,
      }}
    >
      <IconSymbol
        name={player.isPlaying ? 'pause.fill' : 'play.fill'}
        size={12}
        color={Colors.accent}
      />
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.accent }}>
        {player.isPlaying ? formatDuration(player.currentTime) : formatDuration(duration ?? player.duration)}
      </Text>
    </Pressable>
  );
}

function SongSheetLine({
  line,
  chordDisplayMode,
  customChords,
}: {
  line: SongViewLine;
  chordDisplayMode: SongViewData['chordDisplayMode'];
  customChords: SongViewData['customChords'];
}) {
  const charWidth = useRef(10);
  const hasResolvedChord = line.chordAnnotations.some((annotation) =>
    !!resolveChordShape(annotation.chord, customChords)
  );
  const chordRowHeight =
    chordDisplayMode === 'name' || !hasResolvedChord
      ? CHORD_ROW_HEIGHTS.name
      : CHORD_ROW_HEIGHTS[chordDisplayMode];

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      {line.chordAnnotations.length > 0 && (
        <View style={{ height: chordRowHeight, position: 'relative' }}>
          {line.chordAnnotations.map((annotation) => {
            const shape = resolveChordShape(annotation.chord, customChords);
            const left = annotation.charOffset * (charWidth.current || 10);

            if (chordDisplayMode === 'diagram' && shape) {
              return (
                <View key={annotation.charOffset} style={{ position: 'absolute', left, top: 2 }}>
                  <ChordDiagram chordName={annotation.chord} shape={shape} width={54} showLabel={false} />
                </View>
              );
            }

            if (chordDisplayMode === 'both' && shape) {
              return (
                <View key={annotation.charOffset} style={{ position: 'absolute', left, top: 2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.chordColor }}>
                    {annotation.chord}
                  </Text>
                  <ChordDiagram chordName={annotation.chord} shape={shape} width={56} showLabel={false} />
                </View>
              );
            }

            return (
              <Text
                key={annotation.charOffset}
                style={{
                  position: 'absolute',
                  left,
                  top: 2,
                  fontSize: 13,
                  fontWeight: '700',
                  color: Colors.chordColor,
                }}
              >
                {annotation.chord}
              </Text>
            );
          })}
        </View>
      )}

      <Text
        style={{
          fontSize: 17,
          lineHeight: 26,
          color: Colors.textPrimary,
          fontFamily: Fonts.mono,
        }}
      >
        {line.text || ' '}
      </Text>

      {line.memo && (
        <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 18, color: Colors.textSecondary }}>
          {line.memo}
        </Text>
      )}

      <AudioBadge uri={line.audioUri} duration={line.lineRecordingDuration} />

      <Text
        style={{
          position: 'absolute',
          opacity: 0,
          fontSize: 17,
          fontFamily: Fonts.mono,
          pointerEvents: 'none',
        }}
        onLayout={(event) => {
          charWidth.current = event.nativeEvent.layout.width;
        }}
      >
        W
      </Text>
    </View>
  );
}

export function SongSheetView({ data }: { data: SongViewData }) {
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: Colors.textPrimary }}>
          {data.title}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
          {[data.author ? `shared by ${data.author}` : null, data.key, data.bpm ? `${data.bpm} BPM` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      {data.sections.map((section) => (
        <View key={section.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.textPrimary }}>
              {section.label}
            </Text>
            <AudioBadge uri={section.audioUri} duration={section.sectionRecordingDuration} />
          </View>

          <View style={{ gap: 8 }}>
            {section.lines.map((line) => (
              <SongSheetLine
                key={line.id}
                line={line}
                chordDisplayMode={data.chordDisplayMode}
                customChords={data.customChords}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
