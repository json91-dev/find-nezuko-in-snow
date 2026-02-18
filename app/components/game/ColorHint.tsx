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
    const sisterEffectDistance = 18; // effect starts inside this range
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

    // Warm golden-white + 클리어 느낌의 은은한 핑크 (가까울수록 더 밝고 희망찬 빛)
    const r = 255;
    const g = Math.round(252 - strength * 14); // 가까울수록 살짝 핑크 (255→238)
    const b = Math.round(230 + strength * 15); // 가까울수록 밝은 핑크빛 (230→245)
    const opacity = strength * 0.4; // 가까울수록 더 환하게

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
  }, [demonDistance, demonMaxDistance]);

  return (
    <>
      <div style={style} />
      {demonStyle && <div style={demonStyle} />}
    </>
  );
}
