import { useRef, useState, useCallback } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const MAX_DURATION_MS = 5 * 60 * 1000;

export type RecorderState = 'idle' | 'recording' | 'stopped';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Could not start recording';
}

export function useAudioRecorderHook(storageKey: string) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderStatus = useAudioRecorderState(recorder);
  const [state, setState] = useState<RecorderState>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);

      const existingPermission = await getRecordingPermissionsAsync();
      const permission = existingPermission.granted
        ? existingPermission
        : await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setError('Microphone permission denied');
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');

      capTimer.current = setTimeout(() => {
        void stop();
      }, MAX_DURATION_MS);

      return true;
    } catch (startError) {
      setState('idle');
      setError(getErrorMessage(startError));
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (capTimer.current) {
      clearTimeout(capTimer.current);
      capTimer.current = null;
    }

    try {
      await recorder.stop();
      setState('stopped');

      const status = recorder.getStatus();
      const tempUri = recorder.uri ?? status.url;
      if (!tempUri) {
        setError('Recording finished but no audio file was created');
        return null;
      }

      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
      const dest = RECORDINGS_DIR + storageKey + '.m4a';
      await FileSystem.copyAsync({ from: tempUri, to: dest });

      setSavedUri(dest);

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      return dest;
    } catch (stopError) {
      setError(getErrorMessage(stopError).replace('start', 'save'));
      return null;
    }
  }, [recorder, storageKey]);

  const reset = useCallback(() => {
    if (capTimer.current) {
      clearTimeout(capTimer.current);
      capTimer.current = null;
    }

    setState('idle');
    setSavedUri(null);
    setError(null);
  }, []);

  return {
    state,
    isRecording: recorderStatus.isRecording || state === 'recording',
    currentTime: (recorderStatus.durationMillis ?? 0) / 1000,
    savedUri,
    error,
    start,
    stop,
    reset,
  };
}
