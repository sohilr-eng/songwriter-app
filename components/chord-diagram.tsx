import Svg, {
  Line, Circle, Rect, Text as SvgText, G,
} from 'react-native-svg';
import { getChordShape } from '@/utils/chord-shapes';
import { Colors } from '@/constants/theme';

// ── Layout constants ──────────────────────────────────────────────────────
const STRING_COUNT = 6;
const FRET_ROWS = 5;
const S = 28;          // string spacing (px)
const F = 30;          // fret spacing (px)
const DOT_R = 10;      // fingering dot radius
const LEFT = 28;       // left margin (for fret number label)
const TOP = 44;        // top margin (for ○/× symbols)
const NUT_H = 5;       // nut bar height

export const DIAGRAM_WIDTH  = LEFT + (STRING_COUNT - 1) * S + 20;
export const DIAGRAM_HEIGHT = TOP + FRET_ROWS * F + 20;

// String x positions (left = low E, right = high e)
function sx(strIndex: number) { return LEFT + strIndex * S; }
// Fret y centre (row 1 = between fret lines 0 and 1)
function fy(row: number) { return TOP + (row - 0.5) * F; }

interface ChordDiagramProps {
  chordName: string;
  width?: number;
  showLabel?: boolean;
}

export function ChordDiagram({
  chordName,
  width = DIAGRAM_WIDTH,
  showLabel = true,
}: ChordDiagramProps) {
  const shape = getChordShape(chordName);
  const baseFret = shape?.baseFret ?? 1;
  const frets   = shape?.frets ?? [-1, -1, -1, -1, -1, -1];
  const fingers = shape?.fingers;
  const barre   = shape?.barre;

  const dark = Colors.accent;
  const bg   = Colors.surface;

  return (
    <Svg
      width={width}
      height={(width / DIAGRAM_WIDTH) * DIAGRAM_HEIGHT}
      viewBox={`0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}`}
    >

      {/* ── Nut or baseFret label ─────────────────────────────────────── */}
      {baseFret === 1 ? (
        <Rect
          x={sx(0)} y={TOP - NUT_H}
          width={(STRING_COUNT - 1) * S} height={NUT_H}
          fill={dark} rx={2}
        />
      ) : (
        <SvgText
          x={LEFT - 8} y={TOP + F * 0.5}
          fontSize={13} fontWeight="700"
          fill={dark} textAnchor="end" alignmentBaseline="middle"
        >
          {baseFret}
        </SvgText>
      )}

      {/* ── Fret lines ───────────────────────────────────────────────── */}
      {Array.from({ length: FRET_ROWS + 1 }, (_, i) => (
        <Line
          key={`fl${i}`}
          x1={sx(0)} y1={TOP + i * F}
          x2={sx(STRING_COUNT - 1)} y2={TOP + i * F}
          stroke={Colors.border} strokeWidth={i === 0 && baseFret === 1 ? 0 : 1.5}
        />
      ))}

      {/* ── String lines ─────────────────────────────────────────────── */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <Line
          key={`sl${i}`}
          x1={sx(i)} y1={TOP}
          x2={sx(i)} y2={TOP + FRET_ROWS * F}
          stroke={Colors.border} strokeWidth={1.5}
        />
      ))}

      {/* ── Open / muted symbols above nut ───────────────────────────── */}
      {frets.map((fret, i) => {
        if (fret === 0) {
          return (
            <Circle
              key={`os${i}`}
              cx={sx(i)} cy={TOP - NUT_H - 12}
              r={7} stroke={dark} strokeWidth={1.8} fill="none"
            />
          );
        }
        if (fret === -1) {
          return (
            <G key={`ms${i}`}>
              <Line
                x1={sx(i) - 6} y1={TOP - NUT_H - 18}
                x2={sx(i) + 6} y2={TOP - NUT_H - 6}
                stroke={dark} strokeWidth={2} strokeLinecap="round"
              />
              <Line
                x1={sx(i) + 6} y1={TOP - NUT_H - 18}
                x2={sx(i) - 6} y2={TOP - NUT_H - 6}
                stroke={dark} strokeWidth={2} strokeLinecap="round"
              />
            </G>
          );
        }
        return null;
      })}

      {/* ── Barre bar ────────────────────────────────────────────────── */}
      {barre != null && (() => {
        const row = barre - baseFret + 1;
        const barreStrings = frets
          .map((f, i) => ({ f, i }))
          .filter(({ f }) => f >= barre);
        if (barreStrings.length < 2) return null;
        const fromStr = barreStrings[0].i;
        const toStr   = barreStrings[barreStrings.length - 1].i;
        return (
          <Rect
            key="barre"
            x={sx(fromStr) - DOT_R}
            y={fy(row) - DOT_R}
            width={(toStr - fromStr) * S + DOT_R * 2}
            height={DOT_R * 2}
            rx={DOT_R} fill={dark}
          />
        );
      })()}

      {/* ── Finger dots ──────────────────────────────────────────────── */}
      {frets.map((fret, i) => {
        if (fret <= 0) return null;
        const row = fret - baseFret + 1;
        if (row < 1 || row > FRET_ROWS) return null;
        // Skip if this position is covered by the barre bar
        if (barre != null && fret === barre) return null;
        const fingerNum = fingers?.[i];
        return (
          <G key={`dot${i}`}>
            <Circle cx={sx(i)} cy={fy(row)} r={DOT_R} fill={dark} />
            {fingerNum != null && fingerNum > 0 && (
              <SvgText
                x={sx(i)} y={fy(row)}
                fontSize={11} fontWeight="700"
                fill={bg} textAnchor="middle" alignmentBaseline="central"
              >
                {fingerNum}
              </SvgText>
            )}
          </G>
        );
      })}

      {/* ── Chord name label ─────────────────────────────────────────── */}
      {showLabel && (
        <SvgText
          x={DIAGRAM_WIDTH / 2}
          y={DIAGRAM_HEIGHT - 6}
          fontSize={14} fontWeight="700"
          fill={dark} textAnchor="middle"
        >
          {chordName}
        </SvgText>
      )}
    </Svg>
  );
}
