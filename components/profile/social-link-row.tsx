import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface Props {
  icon: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
}

export function SocialLinkRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'url',
}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
      }}
    >
      <IconSymbol name={icon} size={18} color={Colors.icon} />
      <Text style={{ fontSize: 13, color: Colors.textSecondary, width: 84 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 2 }}
      />
    </View>
  );
}
