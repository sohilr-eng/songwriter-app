import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  editable?: boolean;
}

export function ProfileFormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines,
  autoCapitalize,
  keyboardType,
  editable = true,
}: Props) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : undefined}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        style={{
          fontSize: 16,
          color: editable ? Colors.textPrimary : Colors.textSecondary,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderSubtle,
          minHeight: multiline ? (numberOfLines ?? 4) * 24 : undefined,
        }}
      />
    </View>
  );
}
