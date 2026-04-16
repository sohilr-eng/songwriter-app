import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface UndoBarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoBar({ visible, message, onUndo, onDismiss, duration = 4000 }: UndoBarProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onDismiss());
      }, duration);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        opacity,
        zIndex: 100,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.accent,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Text style={{ flex: 1, color: Colors.accentForeground, fontSize: 15 }}>
          {message}
        </Text>
        <Pressable
          onPress={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onUndo();
          }}
          hitSlop={8}
        >
          <Text style={{ color: Colors.accentForeground, fontWeight: '700', fontSize: 15 }}>
            Undo
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
