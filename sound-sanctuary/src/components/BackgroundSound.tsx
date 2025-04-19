import React, { useEffect, useRef } from 'react';

interface BackgroundSoundProps {
  sound: string | null;
  playing: boolean;
  volume: number;
}

const soundMap: Record<string, string> = {
  rain: '/sounds/gentle-rain.wav',
  bowl: '/sounds/gentle-creek.wav',
  stream: '/sounds/creek-test.wav',
  ocean: '/sounds/rain-on-leaves.wav',
  ambient: '/sounds/1982_gentle-rain-on-leaves-with-soft-wind-and-suburban-ambience.wav',
};

const BackgroundSound: React.FC<BackgroundSoundProps> = ({ sound, playing, volume }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start/stop audio when sound/playing changes
  useEffect(() => {
    if (!sound || !playing) return;
    // Stop previous background audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Play new background audio
    const audio = new window.Audio(soundMap[sound] || soundMap['rain']);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    audio.play();
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [sound, playing]);

  // Update volume live
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return null;
};

export default BackgroundSound;
