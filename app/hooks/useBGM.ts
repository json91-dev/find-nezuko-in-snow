"use client";

import { useEffect, useRef } from "react";

interface UseBGMProps {
  src: string;
  volume?: number;
  enabled: boolean;
}

export default function useBGM({ src, volume = 0.3, enabled }: UseBGMProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Try to play (may be blocked by autoplay policy)
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay was prevented, will start on user interaction
        const startOnInteraction = () => {
          audio.play();
          document.removeEventListener("click", startOnInteraction);
          document.removeEventListener("keydown", startOnInteraction);
          document.removeEventListener("touchstart", startOnInteraction);
        };
        document.addEventListener("click", startOnInteraction);
        document.addEventListener("keydown", startOnInteraction);
        document.addEventListener("touchstart", startOnInteraction);
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src, volume, enabled]);

  return audioRef;
}
