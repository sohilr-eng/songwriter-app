import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function useAudioPlayerHook(uri: string | null) {
  const player = useAudioPlayer(uri ?? '');
  const status = useAudioPlayerStatus(player);

  const play = useCallback(() => {
    if (!uri) return;
    player.play();
  }, [player, uri]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  const seekTo = useCallback((seconds: number) => {
    player.seekTo(seconds);
  }, [player]);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  return {
    play,
    pause,
    togglePlayPause,
    seekTo,
    isPlaying: status.playing ?? false,
    isLoaded: status.isLoaded ?? false,
    duration,
    currentTime,
    progress,
  };
}
