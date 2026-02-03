"use client";

import { useState, useEffect, useRef } from "react";

interface GameHUDProps {
  isPlaying: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function GameHUD({ isPlaying }: GameHUDProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      startTimeRef.current = null;
      setElapsed(0);
      return;
    }

    startTimeRef.current = Date.now();

    const tick = () => {
      if (startTimeRef.current) {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-6">
      <div className="rounded-lg border border-white/20 bg-black/30 px-6 py-2 backdrop-blur-md">
        <span className="font-mono text-2xl font-bold tracking-widest text-white/90">
          {formatTime(elapsed)}
        </span>
      </div>
    </div>
  );
}
