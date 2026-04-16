// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = string;

const MAPPING: IconMapping = {
  // Navigation
  'house.fill':                         'home',
  'paperplane.fill':                    'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right':                      'chevron-right',
  'chevron.left':                       'chevron-left',
  'chevron.down':                       'keyboard-arrow-down',
  'chevron.up':                         'keyboard-arrow-up',

  // Actions
  'plus':                               'add',
  'plus.circle':                        'add-circle-outline',
  'plus.circle.fill':                   'add-circle',
  'minus':                              'remove',
  'minus.circle':                       'remove-circle-outline',
  'minus.circle.fill':                  'remove-circle',
  'trash':                              'delete',
  'trash.fill':                         'delete',
  'pencil':                             'edit',
  'xmark':                              'close',
  'xmark.circle.fill':                  'cancel',
  'checkmark':                          'check',
  'checkmark.circle.fill':              'check-circle',
  'ellipsis':                           'more-horiz',
  'ellipsis.circle':                    'more-horiz',
  'square.and.arrow.up':                'share',
  'arrow.uturn.backward':               'undo',

  // Songwriter-specific
  'music.note':                         'music-note',
  'music.note.list':                    'queue-music',
  'rectangle.stack.fill':               'library-music',
  'lightbulb.fill':                     'lightbulb',
  'mic.fill':                           'mic',
  'mic':                                'mic-none',
  'play.fill':                          'play-arrow',
  'pause.fill':                         'pause',
  'stop.fill':                          'stop',
  'waveform':                           'graphic-eq',
  'camera':                             'camera-alt',
  'photo.on.rectangle':                 'photo-library',
  'clock.arrow.circlepath':             'history',
  'tag.fill':                           'label',
  'magnifyingglass':                    'search',
  'arrow.up.arrow.down':                'swap-vert',
  'nosign':                             'block',
  'doc.on.doc':                         'content-copy',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={materialName} style={style} />;
}
