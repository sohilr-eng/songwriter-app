/**
 * Static chord shape data for SVG fretboard diagrams.
 *
 * frets:    6 strings [E A D G B e] — absolute fret numbers.
 *           -1 = muted (×), 0 = open (○), 1+ = finger position.
 * fingers:  optional finger numbers per string (0 = open/muted, 1–4).
 * barre:    absolute fret number where a barre bar should be drawn.
 * baseFret: first visible fret row in diagram (default 1).
 *           When baseFret > 1, a fret number label is shown.
 */
export interface ChordShape {
  frets: number[];
  fingers?: number[];
  barre?: number;
  baseFret?: number;
}

export const CHORD_SHAPES: Record<string, ChordShape> = {
  // ── Major ────────────────────────────────────────────────────────────────
  C:    { frets: [-1, 3, 2, 0, 1, 0],  fingers: [0, 3, 2, 0, 1, 0] },
  'C#': { frets: [-1, 4, 6, 6, 6, 4],  fingers: [0, 1, 3, 4, 3, 1],  barre: 4, baseFret: 4 },
  Db:   { frets: [-1, 4, 6, 6, 6, 4],  fingers: [0, 1, 3, 4, 3, 1],  barre: 4, baseFret: 4 },
  D:    { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'D#': { frets: [3, 5, 5, 4, 3, 3],   fingers: [1, 3, 4, 2, 1, 1],  barre: 3, baseFret: 3 },
  Eb:   { frets: [3, 5, 5, 4, 3, 3],   fingers: [1, 3, 4, 2, 1, 1],  barre: 3, baseFret: 3 },
  E:    { frets: [0, 2, 2, 1, 0, 0],   fingers: [0, 2, 3, 1, 0, 0] },
  F:    { frets: [1, 3, 3, 2, 1, 1],   fingers: [1, 3, 4, 2, 1, 1],  barre: 1 },
  'F#': { frets: [2, 4, 4, 3, 2, 2],   fingers: [1, 3, 4, 2, 1, 1],  barre: 2, baseFret: 2 },
  Gb:   { frets: [2, 4, 4, 3, 2, 2],   fingers: [1, 3, 4, 2, 1, 1],  barre: 2, baseFret: 2 },
  G:    { frets: [3, 2, 0, 0, 0, 3],   fingers: [2, 1, 0, 0, 0, 3] },
  'G#': { frets: [4, 6, 6, 5, 4, 4],   fingers: [1, 3, 4, 2, 1, 1],  barre: 4, baseFret: 4 },
  Ab:   { frets: [4, 6, 6, 5, 4, 4],   fingers: [1, 3, 4, 2, 1, 1],  barre: 4, baseFret: 4 },
  A:    { frets: [-1, 0, 2, 2, 2, 0],  fingers: [0, 0, 1, 2, 3, 0] },
  'A#': { frets: [-1, 1, 3, 3, 3, 1],  fingers: [0, 1, 2, 3, 4, 1],  barre: 1, baseFret: 1 },
  Bb:   { frets: [-1, 1, 3, 3, 3, 1],  fingers: [0, 1, 2, 3, 4, 1],  barre: 1, baseFret: 1 },
  B:    { frets: [-1, 2, 4, 4, 4, 2],  fingers: [0, 1, 2, 3, 4, 1],  barre: 2, baseFret: 2 },

  // ── Minor ────────────────────────────────────────────────────────────────
  Cm:   { frets: [3, 3, 5, 5, 4, 3],   fingers: [1, 1, 3, 4, 2, 1],  barre: 3, baseFret: 3 },
  'C#m':{ frets: [4, 4, 6, 6, 5, 4],   fingers: [1, 1, 3, 4, 2, 1],  barre: 4, baseFret: 4 },
  Dbm:  { frets: [4, 4, 6, 6, 5, 4],   fingers: [1, 1, 3, 4, 2, 1],  barre: 4, baseFret: 4 },
  Dm:   { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D#m':{ frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2],  baseFret: 1 },
  Ebm:  { frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2],  baseFret: 1 },
  Em:   { frets: [0, 2, 2, 0, 0, 0],   fingers: [0, 2, 3, 0, 0, 0] },
  Fm:   { frets: [1, 3, 3, 1, 1, 1],   fingers: [1, 3, 4, 1, 1, 1],  barre: 1 },
  'F#m':{ frets: [2, 4, 4, 2, 2, 2],   fingers: [1, 3, 4, 1, 1, 1],  barre: 2, baseFret: 2 },
  Gbm:  { frets: [2, 4, 4, 2, 2, 2],   fingers: [1, 3, 4, 1, 1, 1],  barre: 2, baseFret: 2 },
  Gm:   { frets: [3, 5, 5, 3, 3, 3],   fingers: [1, 3, 4, 1, 1, 1],  barre: 3, baseFret: 3 },
  'G#m':{ frets: [4, 6, 6, 4, 4, 4],   fingers: [1, 3, 4, 1, 1, 1],  barre: 4, baseFret: 4 },
  Abm:  { frets: [4, 6, 6, 4, 4, 4],   fingers: [1, 3, 4, 1, 1, 1],  barre: 4, baseFret: 4 },
  Am:   { frets: [-1, 0, 2, 2, 1, 0],  fingers: [0, 0, 2, 3, 1, 0] },
  'A#m':{ frets: [-1, 1, 3, 3, 2, 1],  fingers: [0, 1, 3, 4, 2, 1],  barre: 1, baseFret: 1 },
  Bbm:  { frets: [-1, 1, 3, 3, 2, 1],  fingers: [0, 1, 3, 4, 2, 1],  barre: 1, baseFret: 1 },
  Bm:   { frets: [-1, 2, 4, 4, 3, 2],  fingers: [0, 1, 3, 4, 2, 1],  barre: 2, baseFret: 2 },

  // ── Dominant 7th ─────────────────────────────────────────────────────────
  C7:   { frets: [-1, 3, 2, 3, 1, 0],  fingers: [0, 3, 2, 4, 1, 0] },
  D7:   { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  E7:   { frets: [0, 2, 0, 1, 0, 0],   fingers: [0, 2, 0, 1, 0, 0] },
  F7:   { frets: [1, 3, 1, 2, 1, 1],   fingers: [1, 3, 1, 2, 1, 1],  barre: 1 },
  G7:   { frets: [3, 2, 0, 0, 0, 1],   fingers: [3, 2, 0, 0, 0, 1] },
  A7:   { frets: [-1, 0, 2, 0, 2, 0],  fingers: [0, 0, 2, 0, 3, 0] },
  B7:   { frets: [-1, 2, 1, 2, 0, 2],  fingers: [0, 2, 1, 3, 0, 4] },

  // ── Minor 7th ────────────────────────────────────────────────────────────
  Am7:  { frets: [-1, 0, 2, 0, 1, 0],  fingers: [0, 0, 2, 0, 1, 0] },
  Dm7:  { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 3, 1, 1] },
  Em7:  { frets: [0, 2, 2, 0, 3, 0],   fingers: [0, 2, 3, 0, 4, 0] },
  Fm7:  { frets: [1, 3, 1, 1, 1, 1],   fingers: [1, 3, 1, 1, 1, 1],  barre: 1 },
  'F#m7':{ frets: [2, 4, 2, 2, 2, 2],  fingers: [1, 3, 1, 1, 1, 1],  barre: 2, baseFret: 2 },
  Gm7:  { frets: [3, 5, 3, 3, 3, 3],   fingers: [1, 3, 1, 1, 1, 1],  barre: 3, baseFret: 3 },
  Bm7:  { frets: [-1, 2, 4, 2, 3, 2],  fingers: [0, 1, 3, 1, 2, 1],  barre: 2, baseFret: 2 },

  // ── Major 7th ────────────────────────────────────────────────────────────
  Cmaj7:  { frets: [-1, 3, 2, 0, 0, 0],  fingers: [0, 3, 2, 0, 0, 0] },
  Dmaj7:  { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  Emaj7:  { frets: [0, 2, 1, 1, 0, 0],   fingers: [0, 3, 1, 2, 0, 0] },
  Fmaj7:  { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  Gmaj7:  { frets: [3, 2, 0, 0, 0, 2],   fingers: [3, 2, 0, 0, 0, 1] },
  Amaj7:  { frets: [-1, 0, 2, 1, 2, 0],  fingers: [0, 0, 3, 1, 4, 0] },

  // ── Sus2 / Sus4 ──────────────────────────────────────────────────────────
  Dsus2:  { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  Dsus4:  { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  Asus2:  { frets: [-1, 0, 2, 2, 0, 0],  fingers: [0, 0, 2, 3, 0, 0] },
  Asus4:  { frets: [-1, 0, 2, 2, 3, 0],  fingers: [0, 0, 1, 2, 4, 0] },
  Esus4:  { frets: [0, 2, 2, 2, 0, 0],   fingers: [0, 1, 2, 3, 0, 0] },
  Gsus4:  { frets: [3, 3, 0, 0, 1, 3],   fingers: [2, 3, 0, 0, 1, 4] },

  // ── Add9 ─────────────────────────────────────────────────────────────────
  Cadd9:  { frets: [-1, 3, 2, 0, 3, 0],  fingers: [0, 3, 2, 0, 4, 0] },
  Dadd9:  { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  Gadd9:  { frets: [3, 2, 0, 2, 0, 3],   fingers: [3, 2, 0, 1, 0, 4] },
  Eadd9:  { frets: [0, 2, 2, 1, 0, 2],   fingers: [0, 2, 3, 1, 0, 4] },

  // ── Diminished / Augmented ───────────────────────────────────────────────
  Bdim:   { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0], baseFret: 2 },
  Edim:   { frets: [0, 1, 2, 3, 2, -1],  fingers: [0, 1, 2, 4, 3, 0] },
  Caug:   { frets: [-1, 3, 2, 1, 1, 0],  fingers: [0, 4, 3, 1, 2, 0] },
  Eaug:   { frets: [0, 3, 2, 1, 1, 0],   fingers: [0, 4, 3, 1, 2, 0] },
  Gaug:   { frets: [3, 2, 1, 0, 0, 3],   fingers: [3, 2, 1, 0, 0, 4] },
};

/** Returns shape data or null if not found. */
export function getChordShape(name: string): ChordShape | null {
  return CHORD_SHAPES[name] ?? null;
}

/** Case-insensitive fuzzy lookup — returns the matched key or null. */
export function resolveChordName(input: string): string | null {
  const exact = CHORD_SHAPES[input];
  if (exact) return input;
  // Try capitalizing first letter
  const capped = input.charAt(0).toUpperCase() + input.slice(1);
  return CHORD_SHAPES[capped] ? capped : null;
}
