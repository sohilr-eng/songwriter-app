import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        padding: 4,
        borderRadius: 12,
        backgroundColor: Colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9,
              backgroundColor: selected ? Colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: selected ? Colors.accentForeground : Colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
