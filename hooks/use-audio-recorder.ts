import { useRef, useState, useCallback } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export type RecorderState = 'idle' | 'recording' | 'stopped';

export function useAudioRecorderHook(storageKey: string) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Microphone permission denied');
        return false;
      }

      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');

      // Auto-stop at 5-minute cap
      capTimer.current = setTimeout(() => stop(), MAX_DURATION_MS);
      return true;
    } catch (e) {
      setError('Could not start recording');
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (capTimer.current) clearTimeout(capTimer.current);
    try {
      await recorder.stop();
      setState('stopped');

      const tempUri = recorder.uri;
      if (!tempUri) return null;

      // Copy from temp cache to persistent documentDirectory
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
      const dest = RECORDINGS_DIR + storageKey + '.m4a';
      await FileSystem.copyAsync({ from: tempUri, to: dest });

      setSavedUri(dest);

      // Restore audio mode
      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      return dest;
    } catch (e) {
      setError('Could not save recording');
      return null;
    }
  }, [recorder, storageKey]);

  const reset = useCallback(() => {
    setState('idle');
    setSavedUri(null);
    setError(null);
  }, []);

  return {
    state,
    isRecording: state === 'recording',
    currentTime: recorder.currentTime ?? 0,
    savedUri,
    error,
    start,
    stop,
    reset,
  };
}
