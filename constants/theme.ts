import { Platform } from 'react-native';

// Cool gray-blue + dark navy palette — light theme only
export const Colors = {
  // Backgrounds
  background:             '#EFF1F8',   // outer app background — light cool blue-gray
  surface:                '#FFFFFF',   // cards, sheets, inputs
  surfaceSubtle:          '#F5F6FB',   // secondary row backgrounds

  // Borders
  border:                 '#E3E6F0',
  borderSubtle:           '#ECEEF6',

  // Text
  textPrimary:            '#111827',   // near-black, cool-toned
  textSecondary:          '#8A93AC',   // muted cool gray — metadata, artist names
  textTertiary:           '#B8BECE',   // timestamps, placeholders

  // Accent — dark navy/charcoal (CTA buttons, active states, mini-player)
  accent:                 '#1A1C2E',
  accentForeground:       '#FFFFFF',

  // Secondary button style (light filled — "Shuffle" style)
  accentSubtle:           '#ECEEF6',
  accentSubtleForeground: '#1A1C2E',

  // Destructive
  destructive:            '#E53E3E',
  destructiveForeground:  '#FFFFFF',

  // Tab bar
  tabBar:                 '#FFFFFF',
  tabBarActive:           '#1A1C2E',
  tabBarInactive:         '#B8BECE',

  // Chord annotations shown above lyric lines
  chordColor:             '#4A5880',   // muted blue-slate

  // Waveform
  waveformActive:         '#1A1C2E',
  waveformInactive:       '#D1D5E8',

  // Icon default
  icon:                   '#8A93AC',

  // Tint (kept for React Navigation compatibility)
  tint:                   '#1A1C2E',
};

export const Shadows = {
  card:   '0 1px 3px rgba(26, 28, 46, 0.08), 0 1px 2px rgba(26, 28, 46, 0.04)',
  modal:  '0 4px 24px rgba(26, 28, 46, 0.12)',
  sm:     '0 1px 2px rgba(26, 28, 46, 0.06)',
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
