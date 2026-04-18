import type { ChordShape } from './chord-shapes';

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Open-string MIDI values: E2 A2 D3 G3 B3 E4 (low → high)
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];

const CHORD_FORMULAS: ReadonlyArray<{ intervals: number[]; suffix: string }> = [
  // Extended / 4-note (most specific first)
  { intervals: [0, 2, 4, 7, 10], suffix: '9'     },
  { intervals: [0, 4, 7, 11],    suffix: 'maj7'  },
  { intervals: [0, 3, 7, 10],    suffix: 'm7'    },
  { intervals: [0, 4, 7, 10],    suffix: '7'     },
  { intervals: [0, 3, 6, 9],     suffix: 'dim7'  },
  { intervals: [0, 3, 6, 10],    suffix: 'm7b5'  },
  { intervals: [0, 2, 7, 10],    suffix: '7sus2' },
  { intervals: [0, 5, 7, 10],    suffix: '7sus4' },
  { intervals: [0, 2, 4, 7],     suffix: 'add9'  },
  { intervals: [0, 4, 7, 9],     suffix: '6'     },
  { intervals: [0, 3, 7, 9],     suffix: 'm6'    },
  // Triads
  { intervals: [0, 4, 7],        suffix: ''      },
  { intervals: [0, 3, 7],        suffix: 'm'     },
  { intervals: [0, 3, 6],        suffix: 'dim'   },
  { intervals: [0, 4, 8],        suffix: 'aug'   },
  { intervals: [0, 2, 7],        suffix: 'sus2'  },
  { intervals: [0, 5, 7],        suffix: 'sus4'  },
  // Power chord
  { intervals: [0, 7],           suffix: '5'     },
];

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function recognizeChord(shape: ChordShape): string | null {
  const notes: number[] = [];
  let bassNotePc: number | null = null;

  shape.frets.forEach((fret, i) => {
    if (fret === -1) return;
    const midi = OPEN_MIDI[i] + fret;
    notes.push(midi);
    if (bassNotePc === null) bassNotePc = midi % 12;
  });

  if (notes.length < 2) return null;

  const pitchClasses = [...new Set(notes.map((m) => m % 12))].sort((a, b) => a - b);

  if (pitchClasses.length < 2) return null;

  for (const formula of CHORD_FORMULAS) {
    for (const rootPc of pitchClasses) {
      const intervals = pitchClasses
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      if (arraysEqual(intervals, formula.intervals)) {
        const rootName = NOTE_NAMES[rootPc];
        const chordName = `${rootName}${formula.suffix}`;

        if (bassNotePc !== null && bassNotePc !== rootPc) {
          const bassInterval = (bassNotePc - rootPc + 12) % 12;
          // Skip slash notation for 5th-in-bass — extremely common guitar voicing, not usually annotated
          if (bassInterval !== 7) {
            return `${chordName}/${NOTE_NAMES[bassNotePc]}`;
          }
        }
        return chordName;
      }
    }
  }

  return null;
}
