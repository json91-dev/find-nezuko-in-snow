"use client";

import { useMemo } from "react";

interface ColorHintProps {
  distance: number;
  maxDistance?: number;
  demonDistance: number;
  demonMaxDistance?: number;
}

export default function ColorHint({
  distance,
  maxDistance = 50,
  demonDistance,
  demonMaxDistance = 15,
}: ColorHintProps) {
  const style = useMemo(() => {
    // Sister warmth (existing)
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const warmth = 1 - normalizedDistance;

    const r = Math.round(100 + warmth * 155);
    const g = Math.round(150 + warmth * 30);
    const b = Math.round(255 - warmth * 155);
    const opacity = 0.1 + warmth * 0.1;

    return {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      pointerEvents: "none" as const,
      zIndex: 10,
      transition: "background-color 0.5s ease-out",
    };
  }, [distance, maxDistance]);

  const demonStyle = useMemo(() => {
    if (demonDistance >= demonMaxDistance) return null;

    // Closer = more dark/red
    const proximity = 1 - Math.min(demonDistance / demonMaxDistance, 1);
    const darkness = proximity * 0.6;
    const redness = proximity * 0.15;

    return {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(ellipse at center, rgba(${Math.round(redness * 255)}, 0, 0, ${darkness * 0.3}) 0%, rgba(0, 0, 0, ${darkness}) 100%)`,
      pointerEvents: "none" as const,
      zIndex: 11,
      transition: "all 0.5s ease-out",
    };
  }, [demonDistance, demonMaxDistance]);

  return (
    <>
      <div style={style} />
      {demonStyle && <div style={demonStyle} />}
    </>
  );
}
