import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export default function ChordHelpScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: 20 }}>
      <Text style={{ color: Colors.textSecondary }}>Chord reference coming soon</Text>
    </View>
  );
}
