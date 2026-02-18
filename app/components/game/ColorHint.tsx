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
    // Sister: like demon — only when close. "Light" bright yellow, no tint when far.
    const sisterEffectDistance = 12; // effect starts inside this range

    if (distance >= sisterEffectDistance) {
      return {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "transparent",
        pointerEvents: "none" as const,
        zIndex: 10,
        transition: "background-color 0.5s ease-out",
      };
    }
    const t = 1 - distance / sisterEffectDistance; // 0 far, 1 at sister
    const strength = Math.pow(t, 0.65); // closer = brighter, hopeful ramp

    // Enhanced white light effect - brighter and more prominent
    const r = 255;
    const g = Math.round(255 - strength * 20); // slightly less green as you get closer (255→235)
    const b = Math.round(240 + strength * 15); // keep blue bright (240→255)
    const opacity = strength * 0.65; // increased opacity for more emphasized effect (was 0.4)

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
  }, [distance, maxDistance, demonDistance]);

  const demonStyle = useMemo(() => {
    // Suppress demon effect when in sister's area (< 12 units)
    const sisterEffectDistance = 12;
    if (demonDistance >= demonMaxDistance || distance < sisterEffectDistance) return null;

    // Far: blood tint. Near: stronger vignette/darkness.
    const t = 1 - Math.min(demonDistance / demonMaxDistance, 1);
    // Start blood tint only after a threshold so far distances don't look red.
    const bloodStart = 0.28; // 0..1 (proximity). Higher = later start.
    const bloodT = Math.max((t - bloodStart) / (1 - bloodStart), 0);
    const blood = Math.pow(bloodT, 0.65);
    const near = Math.pow(t, 2.2); // ramps late (so true darkness is mainly up close)

    const bloodAlpha = blood * 0.65;
    const vignetteAlpha = near * 0.65;

    return {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(ellipse at center, rgba(255, 20, 20, ${bloodAlpha * 0.55}) 0%, rgba(90, 0, 0, ${bloodAlpha * 0.75 + vignetteAlpha}) 100%)`,
      pointerEvents: "none" as const,
      zIndex: 11,
      transition: "all 0.5s ease-out",
    };
  }, [demonDistance, demonMaxDistance, distance]);

  return (
    <>
      <div style={style} />
      {demonStyle && <div style={demonStyle} />}
    </>
  );
}
