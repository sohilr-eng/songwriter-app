import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface SectionLabelInputProps {
  value: string;
  onCommit: (label: string) => void;
}

export function SectionLabelInput({ value, onCommit }: SectionLabelInputProps) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<TextInput>(null);

  function handleBlur() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(value);
      return;
    }
    if (trimmed !== value) onCommit(trimmed);
  }

  return (
    <TextInput
      ref={ref}
      value={draft}
      onChangeText={setDraft}
      onBlur={handleBlur}
      returnKeyType="done"
      onSubmitEditing={handleBlur}
      style={{
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        padding: 0,
        fontFamily: Fonts.sans,
      }}
      selectTextOnFocus
    />
  );
}
