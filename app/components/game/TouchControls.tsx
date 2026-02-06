"use client";

import { useEffect, useRef, useCallback } from "react";

interface TouchControlsProps {
  onMove: (forward: number, turn: number) => void;
  enabled: boolean;
}

export default function TouchControls({ onMove, enabled }: TouchControlsProps) {
  const touchStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const moveRef = useRef({ forward: 0, turn: 0 });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      };
      moveRef.current.forward = 1; // Start moving forward on touch
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      e.preventDefault();

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchStartRef.current?.id
      );
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      // Normalize turn value between -1 and 1
      const turn = Math.max(-1, Math.min(1, deltaX / 100));
      moveRef.current.turn = turn;

      onMove(moveRef.current.forward, moveRef.current.turn);
    },
    [enabled, onMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();

      const remainingTouch = Array.from(e.touches).find(
        (t) => t.identifier === touchStartRef.current?.id
      );

      if (!remainingTouch) {
        touchStartRef.current = null;
        moveRef.current = { forward: 0, turn: 0 };
        onMove(0, 0);
      }
    },
    [enabled, onMove]
  );

  useEffect(() => {
    if (!enabled) return;

    const options = { passive: false };
    document.addEventListener("touchstart", handleTouchStart, options);
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, options);
    document.addEventListener("touchcancel", handleTouchEnd, options);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Update movement continuously while touching
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (touchStartRef.current) {
        onMove(moveRef.current.forward, moveRef.current.turn);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [enabled, onMove]);

  return null;
}
