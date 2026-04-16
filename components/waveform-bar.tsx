import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

// ── Playback progress bar ─────────────────────────────────────────────────

interface PlaybackBarProps {
  progress: number;   // 0–1
  onSeek?: (progress: number) => void;
  height?: number;
}

export function PlaybackBar({ progress, onSeek, height = 4 }: PlaybackBarProps) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(progress, { duration: 80 });
  }, [progress, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <Pressable
      onPress={e => {
        if (!onSeek) return;
        // Calculate progress from tap location via nativeEvent
        // We'll handle this via layout width stored in a ref approach
      }}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      <View
        style={{
          height,
          backgroundColor: Colors.waveformInactive,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: Colors.waveformActive,
              borderRadius: height / 2,
            },
            fillStyle,
          ]}
        />
      </View>

      {/* Playhead dot */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: Colors.waveformActive,
            top: -4,
            marginLeft: -6,
          },
          useAnimatedStyle(() => ({ left: `${fillWidth.value * 100}%` as any })),
        ]}
      />
    </Pressable>
  );
}

// ── Recording pulse indicator ─────────────────────────────────────────────

export function RecordingPulse() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1.0, { duration: 600 }),
      ),
      -1,
      false
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: Colors.destructive,
          },
          animStyle,
        ]}
      />
    </View>
  );
}
