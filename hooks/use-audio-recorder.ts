import { useRef, useState, useCallback, useEffect } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setIsAudioActiveAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { ensureRecordingsDirectory, getRecordingFilePath } from '@/lib/audio/recordings';

const MAX_DURATION_MS = 5 * 60 * 1000;

export type RecorderState = 'idle' | 'recording' | 'stopped';

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (
    message.includes('561017449') ||
    message.toLowerCase().includes('session activation failed')
  ) {
    return 'Microphone unavailable on iPhone right now. Close other apps using the mic, stop calls or screen-sharing, and test on a physical device instead of the simulator.';
  }

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

      await ensureRecordingsDirectory();
      const dest = getRecordingFilePath(storageKey);
      await FileSystem.copyAsync({ from: tempUri, to: dest });

      setSavedUri(dest);

      return dest;
    } catch (stopError) {
      setError(getErrorMessage(stopError).replace('start', 'save'));
      return null;
    } finally {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        allowsBackgroundRecording: false,
      }).catch(() => {});
      await setIsAudioActiveAsync(false).catch(() => {});
    }
  }, [recorder, storageKey]);

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

      await setIsAudioActiveAsync(true);
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        allowsBackgroundRecording: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');

      capTimer.current = setTimeout(() => {
        void stop();
      }, MAX_DURATION_MS);

      return true;
    } catch (startError) {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        allowsBackgroundRecording: false,
      }).catch(() => {});
      await setIsAudioActiveAsync(false).catch(() => {});
      setState('idle');
      setError(getErrorMessage(startError));
      return false;
    }
  }, [recorder, stop]);

  const reset = useCallback(() => {
    if (capTimer.current) {
      clearTimeout(capTimer.current);
      capTimer.current = null;
    }

    setState('idle');
    setSavedUri(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (capTimer.current) {
        clearTimeout(capTimer.current);
      }
      void setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        allowsBackgroundRecording: false,
      }).catch(() => {});
      void setIsAudioActiveAsync(false).catch(() => {});
    };
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
