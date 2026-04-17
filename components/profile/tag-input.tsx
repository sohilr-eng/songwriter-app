import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ label, tags, onChange, placeholder = 'Add...', maxTags = 10 }: Props) {
  const [inputValue, setInputValue] = useState('');

  function addTag(raw: string) {
    const tag = raw.replace(/,+$/, '').trim();
    if (!tag || tags.includes(tag) || tags.length >= maxTags) {
      setInputValue('');
      return;
    }
    onChange([...tags, tag]);
    setInputValue('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {tags.map((tag, index) => (
          <View
            key={`${tag}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.accentSubtle,
              borderRadius: 100,
              paddingHorizontal: 10,
              paddingVertical: 4,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 13, color: Colors.accentSubtleForeground, fontWeight: '500' }}>
              {tag}
            </Text>
            <Pressable onPress={() => removeTag(index)} hitSlop={6}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 18 }}>×</Text>
            </Pressable>
          </View>
        ))}
        {tags.length < maxTags && (
          <TextInput
            value={inputValue}
            onChangeText={(text) => {
              if (text.endsWith(',')) {
                addTag(text.slice(0, -1));
              } else {
                setInputValue(text);
              }
            }}
            onSubmitEditing={() => addTag(inputValue)}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            returnKeyType="done"
            blurOnSubmit={false}
            style={{
              fontSize: 14,
              color: Colors.textPrimary,
              paddingVertical: 4,
              minWidth: 80,
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderSubtle,
            }}
          />
        )}
      </View>
    </View>
  );
}
