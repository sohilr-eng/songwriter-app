import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect, useRef } from 'react';

type AudioPlayer = ReturnType<typeof createAudioPlayer>;

// Static require() calls — Metro resolves asset IDs at build time
const PIANO_SAMPLES: Record<string, number> = {
  C3:  require('../assets/sounds/piano/C3.mp3'),
  Db3: require('../assets/sounds/piano/Db3.mp3'),
  D3:  require('../assets/sounds/piano/D3.mp3'),
  Eb3: require('../assets/sounds/piano/Eb3.mp3'),
  E3:  require('../assets/sounds/piano/E3.mp3'),
  F3:  require('../assets/sounds/piano/F3.mp3'),
  Gb3: require('../assets/sounds/piano/Gb3.mp3'),
  G3:  require('../assets/sounds/piano/G3.mp3'),
  Ab3: require('../assets/sounds/piano/Ab3.mp3'),
  A3:  require('../assets/sounds/piano/A3.mp3'),
  Bb3: require('../assets/sounds/piano/Bb3.mp3'),
  B3:  require('../assets/sounds/piano/B3.mp3'),
  C4:  require('../assets/sounds/piano/C4.mp3'),
  Db4: require('../assets/sounds/piano/Db4.mp3'),
  D4:  require('../assets/sounds/piano/D4.mp3'),
  Eb4: require('../assets/sounds/piano/Eb4.mp3'),
  E4:  require('../assets/sounds/piano/E4.mp3'),
  F4:  require('../assets/sounds/piano/F4.mp3'),
  Gb4: require('../assets/sounds/piano/Gb4.mp3'),
  G4:  require('../assets/sounds/piano/G4.mp3'),
  Ab4: require('../assets/sounds/piano/Ab4.mp3'),
  A4:  require('../assets/sounds/piano/A4.mp3'),
  Bb4: require('../assets/sounds/piano/Bb4.mp3'),
  B4:  require('../assets/sounds/piano/B4.mp3'),
};

export function usePianoAudio() {
  const players = useRef<Record<string, AudioPlayer>>({});

  useEffect(() => {
    void setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: true });

    for (const [id, source] of Object.entries(PIANO_SAMPLES)) {
      players.current[id] = createAudioPlayer(source);
    }

    return () => {
      for (const p of Object.values(players.current)) {
        p.release();
      }
      players.current = {};
    };
  }, []);

  function playNote(noteId: string) {
    const p = players.current[noteId];
    if (!p) return;
    p.seekTo(0);
    p.play();
  }

  return { playNote };
}
